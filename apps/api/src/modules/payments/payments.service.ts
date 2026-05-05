import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SmsService } from '../notifications/sms.service';
import { AppointmentStatus, PaymentStatus, Role } from '@prisma/client';
import axios from 'axios';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private notifications: NotificationsService,
    private sms: SmsService,
  ) {}

  /**
   * Initiate payment for an appointment.
   * Generates PayTR iframe token using ZMK's central account.
   */
  async initiatePayment(appointmentId: string, userId: string, ipAddress?: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        customer: true,
        service: true,
        tenant: true,
        payment: true,
      },
    });

    if (!appointment) throw new NotFoundException('Randevu bulunamadı');
    if (appointment.customerId !== userId) throw new BadRequestException('Bu randevu size ait değil');
    if (appointment.payment?.status === PaymentStatus.SUCCESS) {
      throw new BadRequestException('Bu randevunun ödemesi zaten yapılmış');
    }

    const orderId = `ZMK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create or update payment record. NOTE: payment record has tenantId mapping clearly
    const payment = await this.prisma.payment.upsert({
      where: { appointmentId },
      create: {
        tenantId: appointment.tenantId,
        appointmentId,
        amount: appointment.totalPrice,
        paytrOrderId: orderId, // using this field for order ref
        status: PaymentStatus.PENDING,
      },
      update: {
        paytrOrderId: orderId,
        status: PaymentStatus.PENDING,
      },
    });

    const merchant_id = this.configService.get('PAYTR_MERCHANT_ID');
    const merchant_key = this.configService.get('PAYTR_MERCHANT_KEY');
    const merchant_salt = this.configService.get('PAYTR_MERCHANT_SALT');

    if (!merchant_id || !merchant_key || !merchant_salt) {
      this.logger.warn('PayTR credentials missing. Returning sandbox success.');
      // DEV ONLY: Immediate confirmation if no keys provided.
      await this.confirmPayment(payment.id);
      return {
        mode: 'sandbox',
        status: 'success',
        paymentId: payment.id,
        orderId,
      };
    }

    const email = appointment.customer?.email || 'musteri@zmkbeauty.com';
    const payment_amount = Math.round(Number(appointment.totalPrice) * 100).toString();
    const merchant_oid = orderId;
    const user_name = `${appointment.customer.firstName} ${appointment.customer.lastName}`;
    const user_address = appointment.tenant.address || "Belirtilmedi";
    const user_phone = appointment.customer.phone || "05555555555";
    const webUrl = this.configService.get('WEB_URL') || 'http://localhost:3000';
    const merchant_ok_url = `${webUrl}/${appointment.tenant.slug}/booking?success=1&oid=${orderId}`;
    const merchant_fail_url = `${webUrl}/${appointment.tenant.slug}/booking?fail=1&oid=${orderId}`;
    
    // Fallback IP if localhost or undefined
    const user_ip = ipAddress?.replace('::1', '85.100.100.100') || '85.100.100.100'; 
    const timeout_limit = "30";
    const debug_on = "1";
    const test_mode = this.configService.get('PAYTR_TEST_MODE') || "1";

    const user_basket = Buffer.from(JSON.stringify([
      [appointment.service.name, Number(appointment.totalPrice).toFixed(2), 1]
    ])).toString('base64');
    
    const hash_str = merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket + "0" + "0" + "TL" + test_mode;
    const paytr_token = crypto.createHmac('sha256', merchant_key).update(hash_str + merchant_salt).digest('base64');

    const formData = new URLSearchParams({
        merchant_id,
        user_ip,
        merchant_oid,
        email,
        payment_amount,
        paytr_token,
        user_basket,
        debug_on,
        no_installment: "0",
        max_installment: "0",
        user_name,
        user_address,
        user_phone,
        merchant_ok_url,
        merchant_fail_url,
        timeout_limit,
        currency: "TL",
        test_mode,
        lang: "tr"
    });

    try {
        const response = await axios.post('https://www.paytr.com/odeme/api/get-token', formData.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (response.data.status === 'success') {
             return {
                mode: 'live',
                paymentId: payment.id,
                orderId,
                token: response.data.token, // This token will render the iframe in the frontend
             };
        } else {
             this.logger.error(`PayTR Token Error: ${response.data.reason}`);
             throw new BadRequestException('Ödeme başlatılamadı. Lütfen tekrar deneyin.');
        }
    } catch (err) {
        this.logger.error(`PayTR HTTP Error: ${err}`);
        throw new BadRequestException('Ödeme altyapısına bağlanılamadı.');
    }
  }

  /**
   * PayTR callback handler — verifies hash and confirms payment
   */
  async handleCallback(payload: {
    merchant_oid: string;
    status: string;
    total_amount: string;
    hash: string;
  }) {
    const merchantKey = this.configService.get('PAYTR_MERCHANT_KEY');
    const merchantSalt = this.configService.get('PAYTR_MERCHANT_SALT');

    // Verify hash
    if (merchantKey && merchantSalt) {
      const hashStr = `${payload.merchant_oid}${merchantSalt}${payload.status}${payload.total_amount}`;
      const expectedHash = crypto
        .createHmac('sha256', merchantKey)
        .update(hashStr)
        .digest('base64');

      if (payload.hash !== expectedHash) {
        throw new BadRequestException('Geçersiz hash');
      }
    }

    const payment = await this.prisma.payment.findUnique({
      where: { paytrOrderId: payload.merchant_oid },
    });
    if (!payment) throw new NotFoundException('Ödeme bulunamadı');

    if (payload.status === 'success') {
      await this.confirmPayment(payment.id);
    } else {
      await this.failPayment(payment.id);
    }

    return { status: 'OK' };
  }

  private async confirmPayment(paymentId: string) {
    const payment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.SUCCESS,
        paidAt: new Date(),
      },
    });

    // Confirm the appointment
    const appointment = await this.prisma.appointment.update({
      where: { id: payment.appointmentId },
      data: { status: AppointmentStatus.CONFIRMED },
      include: {
        customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
        employee: {
          select: {
            firstName: true,
            lastName: true,
            user: { select: { email: true } },
          },
        },
        service: { select: { name: true, price: true } },
        tenant: { select: { name: true, email: true, phone: true } },
      },
    });

    // SMS confirmation to customer (fire-and-forget) — high open-rate channel for TR
    if (appointment.customer?.phone) {
      const dateStr = appointment.date.toLocaleDateString('tr-TR');
      const text =
        `${appointment.tenant.name}: Randevunuz onaylandi. ` +
        `${dateStr} ${appointment.startTime} - ${appointment.service.name}. ` +
        `Iyi gunler!`;
      this.sms.send(appointment.customer.phone, text).catch(() => {});
    }

    // Send confirmation email to customer (fire-and-forget)
    if (appointment.customer?.email) {
      this.notifications.sendAppointmentConfirmation({
        customerEmail: appointment.customer.email,
        customerName: `${appointment.customer.firstName} ${appointment.customer.lastName}`,
        storeName: appointment.tenant.name,
        serviceName: appointment.service.name,
        employeeName: `${appointment.employee.firstName} ${appointment.employee.lastName}`,
        date: appointment.date.toLocaleDateString('tr-TR'),
        startTime: appointment.startTime,
        totalPrice: `₺${Number(appointment.service.price).toLocaleString('tr-TR')}`,
      }).catch(() => {});
    }

    // Send notification email to store admin (fire-and-forget)
    if (appointment.tenant?.email) {
      this.notifications.sendNewAppointmentToStore({
        storeEmail: appointment.tenant.email,
        storeName: appointment.tenant.name,
        customerName: `${appointment.customer.firstName} ${appointment.customer.lastName}`,
        customerPhone: appointment.customer.phone || undefined,
        serviceName: appointment.service.name,
        employeeName: `${appointment.employee.firstName} ${appointment.employee.lastName}`,
        date: appointment.date.toLocaleDateString('tr-TR'),
        startTime: appointment.startTime,
        totalPrice: `₺${Number(appointment.service.price).toLocaleString('tr-TR')}`,
      }).catch(() => {});
    }

    // Send notification to the assigned employee when they have a linked User
    // account. Fire-and-forget — the customer/store mails above must succeed
    // independently even if the employee has no email.
    if (appointment.employee?.user?.email) {
      this.notifications.sendAppointmentToEmployee({
        employeeEmail: appointment.employee.user.email,
        employeeName: `${appointment.employee.firstName} ${appointment.employee.lastName}`,
        storeName: appointment.tenant.name,
        customerName: `${appointment.customer.firstName} ${appointment.customer.lastName}`,
        customerPhone: appointment.customer.phone || undefined,
        serviceName: appointment.service.name,
        date: appointment.date.toLocaleDateString('tr-TR'),
        startTime: appointment.startTime,
      }).catch(() => {});
    }
  }

  private async failPayment(paymentId: string) {
    const payment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.FAILED,
        failedAt: new Date(),
      },
    });

    await this.prisma.appointment.update({
      where: { id: payment.appointmentId },
      data: { status: AppointmentStatus.CANCELLED },
    });
  }

  async findByTenant(
    tenantId: string,
    query?: { status?: PaymentStatus; from?: string; to?: string; q?: string },
  ) {
    const where: any = { tenantId };
    if (query?.status) where.status = query.status;
    if (query?.from || query?.to) {
      where.createdAt = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(`${query.to}T23:59:59.999Z`) } : {}),
      };
    }
    if (query?.q) {
      where.OR = [
        { paytrOrderId: { contains: query.q, mode: 'insensitive' } },
        { appointment: { customer: { firstName: { contains: query.q, mode: 'insensitive' } } } },
        { appointment: { customer: { lastName: { contains: query.q, mode: 'insensitive' } } } },
        { appointment: { customer: { email: { contains: query.q, mode: 'insensitive' } } } },
        { appointment: { service: { name: { contains: query.q, mode: 'insensitive' } } } },
      ];
    }
    return this.prisma.payment.findMany({
      where,
      include: {
        appointment: {
          include: {
            customer: { select: { firstName: true, lastName: true, email: true } },
            service: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSummary(tenantId: string, query?: { from?: string; to?: string }) {
    const where: any = { tenantId };
    if (query?.from || query?.to) {
      where.createdAt = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(`${query.to}T23:59:59.999Z`) } : {}),
      };
    }

    const [success, pending, failed, refunded, total] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { ...where, status: PaymentStatus.SUCCESS },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payment.aggregate({
        where: { ...where, status: PaymentStatus.PENDING },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payment.aggregate({
        where: { ...where, status: PaymentStatus.FAILED },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payment.aggregate({
        where: { ...where, status: PaymentStatus.REFUNDED },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payment.aggregate({
        where,
        _count: true,
      }),
    ]);

    return {
      success: { amount: Number(success._sum.amount || 0), count: success._count },
      pending: { amount: Number(pending._sum.amount || 0), count: pending._count },
      failed: { amount: Number(failed._sum.amount || 0), count: failed._count },
      refunded: { amount: Number(refunded._sum.amount || 0), count: refunded._count },
      totalCount: total._count,
    };
  }

  async markRefunded(
    id: string,
    actor: { role: Role; tenantId?: string | null },
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      select: { id: true, tenantId: true, status: true, appointmentId: true },
    });
    if (!payment) throw new NotFoundException('Ödeme bulunamadı');

    if (actor.role === Role.STORE_ADMIN && actor.tenantId !== payment.tenantId) {
      throw new ForbiddenException('Bu ödeme mağazanıza ait değil');
    }
    if (payment.status === PaymentStatus.REFUNDED) {
      throw new BadRequestException('Ödeme zaten iade edilmiş');
    }
    if (payment.status !== PaymentStatus.SUCCESS) {
      throw new BadRequestException('Sadece başarılı ödemeler iade edilebilir');
    }

    const updated = await this.prisma.payment.update({
      where: { id },
      data: { status: PaymentStatus.REFUNDED, refundedAt: new Date() },
    });

    // Cancel the appointment as well
    await this.prisma.appointment
      .update({ where: { id: payment.appointmentId }, data: { status: AppointmentStatus.CANCELLED } })
      .catch(() => null);

    return updated;
  }

  async findAll(query?: {
    status?: PaymentStatus;
    from?: string;
    to?: string;
    q?: string;
    tenantId?: string;
  }) {
    const where: any = {};
    if (query?.status) where.status = query.status;
    if (query?.tenantId) where.tenantId = query.tenantId;
    if (query?.from || query?.to) {
      where.createdAt = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(`${query.to}T23:59:59.999Z`) } : {}),
      };
    }
    if (query?.q) {
      where.OR = [
        { paytrOrderId: { contains: query.q, mode: 'insensitive' } },
        { tenant: { name: { contains: query.q, mode: 'insensitive' } } },
        { appointment: { customer: { firstName: { contains: query.q, mode: 'insensitive' } } } },
        { appointment: { customer: { lastName: { contains: query.q, mode: 'insensitive' } } } },
      ];
    }

    return this.prisma.payment.findMany({
      where,
      include: {
        tenant: { select: { name: true, slug: true } },
        appointment: {
          include: {
            customer: { select: { firstName: true, lastName: true } },
            service: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}
