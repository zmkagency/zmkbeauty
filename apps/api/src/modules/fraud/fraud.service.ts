import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FraudService {
  private readonly logger = new Logger(FraudService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Called before an appointment is created.
   * Checks if the user is booking too fast or has a banned status.
   */
  async checkBookingVelocity(userId: string, tenantId: string, ipAddress?: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isBanned: true, riskScore: true },
    });

    if (user?.isBanned) {
      throw new ForbiddenException('Hesabınız şüpheli işlemler nedeniyle askıya alınmıştır.');
    }

    // Check how many appointments the user made in the last 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentAppointmentsCount = await this.prisma.appointment.count({
      where: {
        customerId: userId,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentAppointmentsCount >= 5) {
      // Flag as fraud
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: userId },
          data: {
            isBanned: true,
            riskScore: { increment: 50 },
          },
        }),
        this.prisma.fraudLog.create({
          data: {
            userId,
            tenantId,
            reason: 'High booking velocity (>= 5 per hour)',
            severity: 'HIGH',
            actionTaken: 'BANNED',
            ipAddress,
          },
        }),
      ]);

      this.logger.warn(`User ${userId} banned for high booking velocity.`);
      throw new ForbiddenException('Çok fazla randevu denemesi. Hesabınız güvenlik nedeniyle durduruldu.');
    }
  }

  /**
   * Called when an appointment is cancelled.
   */
  async checkCancellationVelocity(userId: string, tenantId: string, ipAddress?: string): Promise<void> {
    // Check how many appointments the user cancelled today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayCancellationsCount = await this.prisma.appointment.count({
      where: {
        customerId: userId,
        status: 'CANCELLED',
        updatedAt: { gte: startOfDay },
      },
    });

    if (todayCancellationsCount >= 3) {
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: userId },
          data: {
            isBanned: true,
            riskScore: { increment: 30 },
          },
        }),
        this.prisma.fraudLog.create({
          data: {
            userId,
            tenantId,
            reason: 'High cancellation velocity (>= 3 per day)',
            severity: 'MEDIUM',
            actionTaken: 'BANNED',
            ipAddress,
          },
        }),
      ]);

      this.logger.warn(`User ${userId} banned for high cancellation velocity.`);
      throw new ForbiddenException('Sürekli randevu iptali sebebiyle hesabınız durduruldu.');
    }
  }
}
