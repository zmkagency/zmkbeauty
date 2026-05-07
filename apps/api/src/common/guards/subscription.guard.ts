import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

export const SUBSCRIPTION_TIER_KEY = 'subscription_tier';
export const RequiredTier = (...tiers: string[]) =>
  (target: any, key?: string, descriptor?: any) => {
    Reflect.defineMetadata(SUBSCRIPTION_TIER_KEY, tiers, descriptor?.value ?? target);
    return descriptor ?? target;
  };

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredTiers = this.reflector.get<string[]>(
      SUBSCRIPTION_TIER_KEY,
      context.getHandler(),
    );

    if (!requiredTiers || requiredTiers.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const tenantId = request.params.tenantId || request.user?.tenantId;

    if (!tenantId) return true;

    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });

    if (!subscription) {
      // No subscription = FREE tier
      if (requiredTiers.includes('FREE')) return true;
      throw new HttpException(
        {
          message: 'Bu özellik için plan yükseltmeniz gerekiyor',
          requiredTier: requiredTiers[0],
          currentTier: 'FREE',
          upgradeUrl: '/admin/settings/subscription',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    if (subscription.status === 'CANCELLED' || subscription.status === 'PAST_DUE') {
      // Grace period: 3 days
      const gracePeriodEnd = new Date(subscription.currentPeriodEnd);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3);

      if (new Date() > gracePeriodEnd) {
        throw new HttpException(
          {
            message: 'Aboneliğinizin süresi dolmuş. Lütfen planınızı yenileyin.',
            currentTier: subscription.tier,
            status: subscription.status,
          },
          HttpStatus.PAYMENT_REQUIRED,
        );
      }
    }

    if (requiredTiers.includes(subscription.tier)) {
      return true;
    }

    throw new HttpException(
      {
        message: 'Bu özellik mevcut planınızda kullanılamaz',
        requiredTier: requiredTiers[0],
        currentTier: subscription.tier,
        upgradeUrl: '/admin/settings/subscription',
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}
