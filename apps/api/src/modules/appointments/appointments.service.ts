import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsService } from '../notifications/events.service';
import { SlotEngineService } from './slot-engine.service';
import { CampaignsService } from '../campaigns/campaigns.service';
import { AppointmentStatus, PaymentStatus, Role } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private slotEngine: SlotEngineService,
    private notifications: NotificationsService,
    private campaigns: CampaignsService,
    private events: EventsService,
  ) {}

  async getAvailableSlots(tenantId: string, employeeId: string, serviceId: string, date: string) {
    return this.slotEngine.getAvailableSlots(tenantId, employeeId, serviceId, date);
  }

  async create(data: {
    tenantId: string;
    customerId: string;
    employeeId: string;
    serviceId: string;
    date: string;
    startTime: string;
    notes?: string;
    couponCode?: string;
  }) {
    const service = await this.prisma.service.findUnique({
      where: { id: data.serviceId },
    });
    if (!service) throw new NotFoundException('Hizmet bulunamadı');

    const assignment = await this.prisma.employeeService.findFirst({
      where: { employeeId: data.employeeId, serviceId: data.serviceId },
    });
    if (!assignment) {
      throw new BadRequestException('Bu çalışan seçilen hizmeti verememektedir');
    }

    const endTime = this.addMinutes(data.startTime, service.duration);

    const availableSlots = await this.slotEngine.getAvailableSlots(
      data.tenantId,
      data.employeeId,
      data.serviceId,
      data.date,
    );

    const isAvailable = availableSlots.some(
      (slot) => slot.startTime === data.startTime && slot.endTime === endTime,
    );

    if (!isAvailable) {
      throw new ConflictException('Bu saat dilimi artık müsait değil. Lütfen başka bir saat seçin.');
    }

    // Optional coupon application
    let totalPrice: any = service.price;
    let discount: any = null;
    let campaignId: string | undefined;
    if (data.couponCode) {
      try {
        const result = await this.campaigns.validateCode(
          data.tenantId,
          data.couponCode,
          Number(service.price),
        );
        discount = result.discount;
        totalPrice = result.finalAmount;
        campaignId = result.campaign.id;
      } catch (err) {
        // Re-throw — booking should fail clearly if user provided a bad code
        throw err;
      }
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        tenantId: data.tenantId,
        customerId: data.customerId,
        employeeId: data.employeeId,
        serviceId: data.serviceId,
        date: new Date(data.date),
        startTime: data.startTime,
        endTime,
        totalPrice,
        discount,
        campaignId,
        notes: data.notes,
        status: AppointmentStatus.PENDING_PAYMENT,
      },
      include: {
        service: { select: { name: true, duration: true, price: true } },
        employee: { select: { firstName: true, lastName: true } },
        tenant: { select: { name: true, slug: true } },
        customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
        campaign: { select: { id: true, code: true, title: true } },
      },
    });

    if (campaignId) {
      this.campaigns.incrementUsage(campaignId).catch(() => null);
    }

    this.events.emit({
      type: 'appointment.created',
      tenantId: appointment.tenantId,
      payload: {
        id: appointment.id,
        date: appointment.date,
        startTime: appointment.startTime,
        customerName: `${appointment.customer?.firstName ?? ''} ${appointment.customer?.lastName ?? ''}`.trim(),
        serviceName: appointment.service?.name,
        employeeName: `${appointment.employee?.firstName ?? ''} ${appointment.employee?.lastName ?? ''}`.trim(),
        totalPrice: Number(appointment.totalPrice),
        status: appointment.status,
      },
    });

    return appointment;
  }

  /**
   * Walk-in / manual appointment created by store admin.
   * Bypasses online payment — payment record marked SUCCESS if paid=true,
   * otherwise PENDING (cash collection later).
   */
  async createWalkin(data: {
    tenantId: string;
    employeeId: string;
    serviceId: string;
    date: string;
    startTime: string;
    customerFirstName: string;
    customerLastName: string;
    customerEmail?: string;
    customerPhone?: string;
    notes?: string;
    paid?: boolean;
  }) {
    const service = await this.prisma.service.findUnique({
      where: { id: data.serviceId },
    });
    if (!service) throw new NotFoundException('Hizmet bulunamadı');

    const assignment = await this.prisma.employeeService.findFirst({
      where: { employeeId: data.employeeId, serviceId: data.serviceId },
    });
    if (!assignment) {
      throw new BadRequestException('Bu çalışan seçilen hizmeti verememektedir');
    }

    const endTime = this.addMinutes(data.startTime, service.duration);

    const availableSlots = await this.slotEngine.getAvailableSlots(
      data.tenantId,
      data.employeeId,
      data.serviceId,
      data.date,
    );

    const isAvailable = availableSlots.some(
      (slot) => slot.startTime === data.startTime && slot.endTime === endTime,
    );

    if (!isAvailable) {
      throw new ConflictException('Bu saat dilimi müsait değil.');
    }

    // Find or create a customer User record. Walk-in customers may not have email
    // — fall back to a deterministic synthetic address inside the tenant scope.
    let customer: { id: string } | null = null;
    if (data.customerEmail) {
      customer = await this.prisma.user.findUnique({ where: { email: data.customerEmail }, select: { id: true } });
    }
    if (!customer && data.customerPhone) {
      customer = await this.prisma.user.findFirst({
        where: { tenantId: data.tenantId, phone: data.customerPhone, role: Role.CUSTOMER },
        select: { id: true },
      });
    }
    if (!customer) {
      const syntheticEmail =
        data.customerEmail ||
        `walkin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@walkin.zmkbeauty.local`;
      customer = await this.prisma.user.create({
        data: {
          email: syntheticEmail,
          firstName: data.customerFirstName,
          lastName: data.customerLastName,
          phone: data.customerPhone,
          passwordHash: '!walkin', // unusable — walk-in account, no login
          role: Role.CUSTOMER,
          tenantId: data.tenantId,
        },
        select: { id: true },
      });
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        tenantId: data.tenantId,
        customerId: customer.id,
        employeeId: data.employeeId,
        serviceId: data.serviceId,
        date: new Date(data.date),
        startTime: data.startTime,
        endTime,
        totalPrice: service.price,
        notes: data.notes,
        status: AppointmentStatus.CONFIRMED,
      },
      include: {
        service: true,
        employee: { select: { firstName: true, lastName: true } },
        customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
      },
    });

    // Always create a payment record so accounting reflects the booking
    await this.prisma.payment.create({
      data: {
        tenantId: data.tenantId,
        appointmentId: appointment.id,
        amount: service.price,
        status: data.paid ? PaymentStatus.SUCCESS : PaymentStatus.PENDING,
        paidAt: data.paid ? new Date() : null,
        paytrOrderId: `WALKIN-${appointment.id}`,
        metadata: { source: 'walkin' },
      },
    });

    this.events.emit({
      type: 'appointment.created',
      tenantId: appointment.tenantId,
      payload: {
        id: appointment.id,
        source: 'walkin',
        date: appointment.date,
        startTime: appointment.startTime,
        customerName: `${appointment.customer?.firstName ?? ''} ${appointment.customer?.lastName ?? ''}`.trim(),
        serviceName: appointment.service?.name,
        employeeName: `${appointment.employee?.firstName ?? ''} ${appointment.employee?.lastName ?? ''}`.trim(),
        totalPrice: Number(appointment.totalPrice),
        status: appointment.status,
      },
    });

    return appointment;
  }

  /**
   * Reschedule an appointment to a new date/time (and optionally a new employee).
   * - Customer can reschedule their own appointments (≥ 2h before original start)
   * - Store admin / superadmin can reschedule any appointment in their scope
   * - Cannot reschedule completed / cancelled / no-show appointments
   */
  async reschedule(
    appointmentId: string,
    actor: { id: string; role: Role; tenantId?: string | null },
    payload: { date: string; startTime: string; employeeId?: string },
  ) {
    const existing = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { service: true, tenant: { select: { name: true, email: true } }, customer: true },
    });
    if (!existing) throw new NotFoundException('Randevu bulunamadı');

    if (
      existing.status === AppointmentStatus.COMPLETED ||
      existing.status === AppointmentStatus.CANCELLED ||
      existing.status === AppointmentStatus.NO_SHOW
    ) {
      throw new BadRequestException('Bu randevu artık ertelenemez');
    }

    // Authorization
    if (actor.role === Role.CUSTOMER) {
      if (existing.customerId !== actor.id) throw new ForbiddenException('Bu randevu size ait değil');
      // Enforce 2h-before-start cutoff for customer self-service
      const original = new Date(existing.date);
      const [oh, om] = existing.startTime.split(':').map(Number);
      original.setHours(oh, om, 0, 0);
      const twoHoursMs = 2 * 60 * 60 * 1000;
      if (original.getTime() - Date.now() < twoHoursMs) {
        throw new BadRequestException(
          'Randevuya 2 saatten az süre kaldı. Lütfen mağaza ile iletişime geçin.',
        );
      }
    } else if (actor.role === Role.STORE_ADMIN) {
      if (actor.tenantId !== existing.tenantId) {
        throw new ForbiddenException('Bu randevu mağazanıza ait değil');
      }
    }
    // SUPERADMIN passes through

    const newEmployeeId = payload.employeeId || existing.employeeId;
    const newEndTime = this.addMinutes(payload.startTime, existing.service.duration);

    // Check slot availability — but allow keeping the same slot (no-op)
    const slots = await this.slotEngine.getAvailableSlots(
      existing.tenantId,
      newEmployeeId,
      existing.serviceId,
      payload.date,
    );
    const isSameSlot =
      newEmployeeId === existing.employeeId &&
      payload.date === existing.date.toISOString().slice(0, 10) &&
      payload.startTime === existing.startTime;
    const isAvailable =
      isSameSlot ||
      slots.some((s) => s.startTime === payload.startTime && s.endTime === newEndTime);
    if (!isAvailable) {
      throw new ConflictException('Seçilen saat müsait değil');
    }

    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        date: new Date(payload.date),
        startTime: payload.startTime,
        endTime: newEndTime,
        employeeId: newEmployeeId,
      },
      include: {
        service: { select: { name: true } },
        employee: { select: { firstName: true, lastName: true } },
        tenant: { select: { name: true, email: true } },
        customer: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    // Notify both sides
    if (updated.customer?.email) {
      this.notifications
        .sendAppointmentConfirmation({
          customerEmail: updated.customer.email,
          customerName: `${updated.customer.firstName} ${updated.customer.lastName}`,
          storeName: updated.tenant.name,
          serviceName: updated.service.name,
          employeeName: `${updated.employee.firstName} ${updated.employee.lastName}`,
          date: updated.date.toLocaleDateString('tr-TR'),
          startTime: updated.startTime,
          totalPrice: `₺${Number(updated.totalPrice).toLocaleString('tr-TR')}`,
        })
        .catch(() => {});
    }

    return updated;
  }

  async findByTenant(
    tenantId: string,
    query?: { status?: AppointmentStatus; date?: string; employeeId?: string; from?: string; to?: string; q?: string },
  ) {
    const where: any = { tenantId };
    if (query?.status) where.status = query.status;
    if (query?.date) where.date = new Date(query.date);
    if (query?.employeeId) where.employeeId = query.employeeId;
    if (query?.from || query?.to) {
      where.date = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }
    if (query?.q) {
      where.OR = [
        { customer: { firstName: { contains: query.q, mode: 'insensitive' } } },
        { customer: { lastName: { contains: query.q, mode: 'insensitive' } } },
        { customer: { email: { contains: query.q, mode: 'insensitive' } } },
        { customer: { phone: { contains: query.q } } },
        { service: { name: { contains: query.q, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.appointment.findMany({
      where,
      include: {
        service: { select: { name: true, duration: true, price: true } },
        employee: { select: { firstName: true, lastName: true } },
        customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        payment: { select: { status: true, paidAt: true, amount: true } },
      },
      orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
    });
  }

  async findByCustomer(customerId: string) {
    return this.prisma.appointment.findMany({
      where: { customerId },
      include: {
        service: { select: { name: true, duration: true, price: true } },
        employee: { select: { firstName: true, lastName: true } },
        tenant: { select: { name: true, slug: true, logo: true, phone: true } },
        payment: { select: { status: true, paidAt: true } },
        review: { select: { id: true, rating: true } },
      },
      orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
    });
  }

  async findById(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        service: true,
        employee: true,
        customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        tenant: { select: { name: true, slug: true, phone: true, address: true } },
        payment: true,
      },
    });
    if (!appointment) throw new NotFoundException('Randevu bulunamadı');
    return appointment;
  }

  async updateStatus(id: string, status: AppointmentStatus) {
    await this.findById(id);
    return this.prisma.appointment.update({
      where: { id },
      data: { status },
    });
  }

  async cancel(id: string, actor: { id: string; role: Role; tenantId?: string | null }) {
    const existing = await this.prisma.appointment.findUnique({
      where: { id },
      select: { id: true, customerId: true, tenantId: true, status: true },
    });
    if (!existing) throw new NotFoundException('Randevu bulunamadı');

    if (existing.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Bu randevu zaten iptal edilmiş');
    }
    if (
      existing.status === AppointmentStatus.COMPLETED ||
      existing.status === AppointmentStatus.NO_SHOW
    ) {
      throw new BadRequestException('Tamamlanmış randevu iptal edilemez');
    }

    if (actor.role === Role.CUSTOMER && existing.customerId !== actor.id) {
      throw new ForbiddenException('Bu randevu size ait değil');
    }
    if (actor.role === Role.STORE_ADMIN && actor.tenantId !== existing.tenantId) {
      throw new ForbiddenException('Bu randevu mağazanıza ait değil');
    }

    const appointment = await this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CANCELLED },
      include: {
        customer: { select: { firstName: true, lastName: true, email: true } },
        service: { select: { name: true } },
        tenant: { select: { name: true } },
      },
    });

    if (appointment.customer?.email) {
      this.notifications
        .sendAppointmentCancellation({
          customerEmail: appointment.customer.email,
          customerName: `${appointment.customer.firstName} ${appointment.customer.lastName}`,
          storeName: appointment.tenant.name,
          serviceName: appointment.service.name,
          date: appointment.date.toLocaleDateString('tr-TR'),
          startTime: appointment.startTime,
        })
        .catch(() => {});
    }

    return appointment;
  }

  async getAllAppointments(query?: {
    status?: AppointmentStatus;
    tenantId?: string;
    from?: string;
    to?: string;
    q?: string;
  }) {
    const where: any = {};
    if (query?.status) where.status = query.status;
    if (query?.tenantId) where.tenantId = query.tenantId;
    if (query?.from || query?.to) {
      where.date = {
        ...(query?.from ? { gte: new Date(query.from) } : {}),
        ...(query?.to ? { lte: new Date(query.to) } : {}),
      };
    }
    if (query?.q) {
      where.OR = [
        { customer: { firstName: { contains: query.q, mode: 'insensitive' } } },
        { customer: { lastName: { contains: query.q, mode: 'insensitive' } } },
        { customer: { email: { contains: query.q, mode: 'insensitive' } } },
        { tenant: { name: { contains: query.q, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.appointment.findMany({
      where,
      include: {
        service: { select: { name: true, price: true } },
        employee: { select: { firstName: true, lastName: true } },
        customer: { select: { firstName: true, lastName: true, email: true } },
        tenant: { select: { name: true, slug: true } },
        payment: { select: { status: true, amount: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  private addMinutes(time: string, minutes: number): string {
    const [h, m] = time.split(':').map(Number);
    const totalMinutes = h * 60 + m + minutes;
    const newH = Math.floor(totalMinutes / 60);
    const newM = totalMinutes % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  }
}
