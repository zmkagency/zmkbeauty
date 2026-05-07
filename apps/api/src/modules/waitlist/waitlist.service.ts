import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WaitlistService {
  constructor(private prisma: PrismaService) {}

  async addToWaitlist(tenantId: string, userId: string, serviceId: string, date: string, employeeId?: string) {
    return this.prisma.waitlist.create({
      data: {
        tenantId,
        userId,
        serviceId,
        employeeId,
        date: new Date(date),
      },
    });
  }

  async getWaitlistForDate(tenantId: string, date: string) {
    return this.prisma.waitlist.findMany({
      where: {
        tenantId,
        date: new Date(date),
        notifiedAt: null,
        bookedAt: null,
        expiredAt: null,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async notifyWaitlist(tenantId: string, date: string, serviceId: string) {
    // Find first person in waitlist for this date/service
    const entry = await this.prisma.waitlist.findFirst({
      where: {
        tenantId,
        date: new Date(date),
        serviceId,
        notifiedAt: null,
        bookedAt: null,
        expiredAt: null,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (entry) {
      await this.prisma.waitlist.update({
        where: { id: entry.id },
        data: { notifiedAt: new Date() },
      });
      // TODO: Send notification (WhatsApp/SMS/Email)
      return entry;
    }
    return null;
  }

  async markBooked(waitlistId: string) {
    return this.prisma.waitlist.update({
      where: { id: waitlistId },
      data: { bookedAt: new Date() },
    });
  }

  async expireEntry(waitlistId: string) {
    return this.prisma.waitlist.update({
      where: { id: waitlistId },
      data: { expiredAt: new Date() },
    });
  }

  async getMyWaitlist(userId: string, tenantId: string) {
    return this.prisma.waitlist.findMany({
      where: { userId, tenantId, bookedAt: null, expiredAt: null },
      orderBy: { date: 'asc' },
    });
  }
}
