import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { SmsService } from './sms.service';
import { AppointmentStatus } from '@prisma/client';

/**
 * Scheduled tasks for the notifications system.
 *
 * - 24h appointment reminders: every hour, find CONFIRMED appointments
 *   scheduled ~24 hours from now and send a reminder via:
 *     • email (always, when customer.email exists)
 *     • SMS (when customer.phone exists AND SMS_PROVIDER is configured)
 *   Each appointment is reminded at most once — tracked via
 *   payment.metadata.reminderSentAt to keep the marker idempotent.
 */
@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private sms: SmsService,
  ) {}

  /** Hourly at minute 5. */
  @Cron('5 * * * *')
  async sendReminders() {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const dayStart = new Date(windowStart);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(windowEnd);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const appts = await this.prisma.appointment.findMany({
      where: {
        date: { gte: dayStart, lte: dayEnd },
        status: AppointmentStatus.CONFIRMED,
      },
      include: {
        customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
        employee: { select: { firstName: true, lastName: true } },
        service: { select: { name: true } },
        tenant: { select: { name: true, phone: true, slug: true } },
        payment: { select: { id: true, metadata: true } },
      },
    });

    let sentEmail = 0;
    let sentSms = 0;
    for (const a of appts) {
      const [hh, mm] = a.startTime.split(':').map(Number);
      const apptStart = new Date(a.date);
      apptStart.setUTCHours(hh, mm, 0, 0);
      if (apptStart < windowStart || apptStart > windowEnd) continue;

      const meta = (a.payment?.metadata as any) || {};
      if (meta.reminderSentAt) continue;

      // Email
      if (a.customer?.email) {
        await this.notifications
          .sendAppointmentReminder({
            customerEmail: a.customer.email,
            customerName: `${a.customer.firstName} ${a.customer.lastName}`,
            storeName: a.tenant.name,
            storePhone: a.tenant.phone || undefined,
            serviceName: a.service.name,
            employeeName: `${a.employee.firstName} ${a.employee.lastName}`,
            date: a.date.toLocaleDateString('tr-TR'),
            startTime: a.startTime,
          })
          .catch((err) => this.logger.error(`Reminder email failed for ${a.id}: ${err}`));
        sentEmail++;
      }

      // SMS — concise format, falls back gracefully if provider not configured
      if (a.customer?.phone) {
        const dateStr = a.date.toLocaleDateString('tr-TR');
        const text =
          `${a.tenant.name}: Yarinki randevunuz ${dateStr} ${a.startTime} ` +
          `(${a.service.name}). Iptal/erteleme: hesabinizdan.`;
        const ok = await this.sms.send(a.customer.phone, text);
        if (ok) sentSms++;
      }

      // Mark as reminded
      if (a.payment) {
        await this.prisma.payment.update({
          where: { id: a.payment.id },
          data: { metadata: { ...meta, reminderSentAt: new Date().toISOString() } },
        });
      }
    }

    if (sentEmail > 0 || sentSms > 0) {
      this.logger.log(`📨 Reminders: ${sentEmail} email + ${sentSms} SMS (24h window)`);
    }
  }
}
