import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Run every day at midnight to find inactive tenants
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleInactiveTenants() {
    this.logger.log('Running daily CRM job to find inactive tenants...');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find store admins whose last login was more than 30 days ago
    const inactiveAdmins = await this.prisma.user.findMany({
      where: {
        role: 'STORE_ADMIN',
        isActive: true,
        lastLoginAt: {
          lt: thirtyDaysAgo,
        },
        tenantId: { not: null },
      },
      include: {
        tenant: true,
      },
    });

    if (inactiveAdmins.length === 0) {
      this.logger.log('No inactive tenants found today.');
      return;
    }

    for (const admin of inactiveAdmins) {
      if (!admin.tenant) continue;
      
      // Here we would integrate with Resend or Mailchimp
      // Example: await this.mailService.sendWinbackEmail(admin.email, admin.tenant.name);
      
      this.logger.log(`[CRM] Sending win-back email to ${admin.email} (Tenant: ${admin.tenant.name})`);
    }

    this.logger.log(`[CRM] Processed ${inactiveAdmins.length} inactive tenants.`);
  }

  /**
   * Run every Monday at 8 AM to send weekly performance summaries
   */
  @Cron('0 8 * * 1')
  async sendWeeklySummaries() {
    this.logger.log('Running weekly CRM job to send performance summaries...');
    // Implementation for weekly reports...
  }
}
