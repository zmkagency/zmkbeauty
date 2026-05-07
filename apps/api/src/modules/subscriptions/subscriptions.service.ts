import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionTier, SubscriptionStatus } from '@prisma/client';

export const TIER_CONFIG = {
  FREE: {
    name: 'Başlangıç',
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxEmployees: 1,
    maxAppointmentsPerMonth: 50,
    commissionRate: 0.05,
    features: ['basic_calendar', 'microsite', 'basic_reports'],
  },
  PRO: {
    name: 'Profesyonel',
    monthlyPrice: 399,
    yearlyPrice: 319 * 12,
    maxEmployees: 5,
    maxAppointmentsPerMonth: -1, // unlimited
    commissionRate: 0.025,
    features: [
      'basic_calendar', 'microsite', 'basic_reports',
      'whatsapp', 'campaigns', 'loyalty', 'analytics',
      'unlimited_appointments', 'sms_reminders',
    ],
  },
  BUSINESS: {
    name: 'İşletme',
    monthlyPrice: 699,
    yearlyPrice: 559 * 12,
    maxEmployees: 15,
    maxAppointmentsPerMonth: -1,
    commissionRate: 0.015,
    features: [
      'basic_calendar', 'microsite', 'basic_reports',
      'whatsapp', 'campaigns', 'loyalty', 'analytics',
      'unlimited_appointments', 'sms_reminders',
      'multi_location', 'ai_scheduling', 'api_access', 'custom_theme',
    ],
  },
  ENTERPRISE: {
    name: 'Kurumsal',
    monthlyPrice: 0, // custom
    yearlyPrice: 0,
    maxEmployees: -1,
    maxAppointmentsPerMonth: -1,
    commissionRate: 0,
    features: ['all'],
  },
};

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async getSubscription(tenantId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
      include: { invoices: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });

    if (!subscription) {
      // Return virtual FREE subscription
      return {
        tier: 'FREE' as SubscriptionTier,
        status: 'ACTIVE' as SubscriptionStatus,
        config: TIER_CONFIG.FREE,
        invoices: [],
      };
    }

    return {
      ...subscription,
      config: TIER_CONFIG[subscription.tier],
    };
  }

  async createOrUpgrade(tenantId: string, tier: SubscriptionTier, billingCycle: 'monthly' | 'yearly') {
    const config = TIER_CONFIG[tier];
    if (!config) throw new BadRequestException('Geçersiz plan');

    const now = new Date();
    const periodEnd = new Date(now);
    if (billingCycle === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const amount = billingCycle === 'yearly' ? config.yearlyPrice : config.monthlyPrice;

    const subscription = await this.prisma.subscription.upsert({
      where: { tenantId },
      create: {
        tenantId,
        tier,
        status: tier === 'FREE' ? 'ACTIVE' : 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        maxEmployees: config.maxEmployees,
        maxAppointmentsPerMonth: config.maxAppointmentsPerMonth,
        commissionRate: config.commissionRate,
      },
      update: {
        tier,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        maxEmployees: config.maxEmployees,
        maxAppointmentsPerMonth: config.maxAppointmentsPerMonth,
        commissionRate: config.commissionRate,
        cancelledAt: null,
      },
    });

    // Create invoice if paid plan
    if (amount > 0) {
      await this.prisma.invoice.create({
        data: {
          tenantId,
          subscriptionId: subscription.id,
          amount,
          description: `${config.name} - ${billingCycle === 'yearly' ? 'Yıllık' : 'Aylık'} Plan`,
          dueDate: now,
          status: 'pending',
        },
      });
    }

    return subscription;
  }

  async cancel(tenantId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });
    if (!subscription) throw new NotFoundException('Abonelik bulunamadı');

    return this.prisma.subscription.update({
      where: { tenantId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });
  }

  async getPlans() {
    return Object.entries(TIER_CONFIG).map(([key, config]) => ({
      tier: key,
      ...config,
    }));
  }

  async checkLimits(tenantId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });

    const tier = subscription?.tier || 'FREE';
    const config = TIER_CONFIG[tier];

    const [employeeCount, monthlyAppointments] = await Promise.all([
      this.prisma.employee.count({ where: { tenantId, isActive: true } }),
      this.prisma.appointment.count({
        where: {
          tenantId,
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),
    ]);

    return {
      tier,
      employees: { current: employeeCount, max: config.maxEmployees, exceeded: config.maxEmployees > 0 && employeeCount >= config.maxEmployees },
      appointments: { current: monthlyAppointments, max: config.maxAppointmentsPerMonth, exceeded: config.maxAppointmentsPerMonth > 0 && monthlyAppointments >= config.maxAppointmentsPerMonth },
    };
  }

  // Check expired subscriptions daily at 9 AM
  @Cron('0 9 * * *')
  async handleExpiredSubscriptions() {
    const now = new Date();
    const gracePeriodDate = new Date(now);
    gracePeriodDate.setDate(gracePeriodDate.getDate() - 3);

    // Find subscriptions past grace period
    const expired = await this.prisma.subscription.findMany({
      where: {
        status: { in: ['PAST_DUE', 'ACTIVE'] },
        currentPeriodEnd: { lt: gracePeriodDate },
        tier: { not: 'FREE' },
      },
    });

    for (const sub of expired) {
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: {
          tier: 'FREE',
          status: 'ACTIVE',
          maxEmployees: TIER_CONFIG.FREE.maxEmployees,
          maxAppointmentsPerMonth: TIER_CONFIG.FREE.maxAppointmentsPerMonth,
          commissionRate: TIER_CONFIG.FREE.commissionRate,
        },
      });
    }
  }
}
