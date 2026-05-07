import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoyaltyTier } from '@prisma/client';

const TIER_THRESHOLDS = {
  BRONZE: 0,
  SILVER: 500,
  GOLD: 2000,
  PLATINUM: 5000,
};

const TIER_MULTIPLIERS = {
  BRONZE: 1,
  SILVER: 1.2,
  GOLD: 1.5,
  PLATINUM: 2,
};

const TIER_DISCOUNTS = {
  BRONZE: 0,
  SILVER: 5,
  GOLD: 10,
  PLATINUM: 15,
};

@Injectable()
export class LoyaltyService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateAccount(userId: string, tenantId: string) {
    return this.prisma.loyaltyAccount.upsert({
      where: { userId_tenantId: { userId, tenantId } },
      create: { userId, tenantId },
      update: {},
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
  }

  async earnPoints(userId: string, tenantId: string, amount: number, source?: string) {
    const account = await this.getOrCreateAccount(userId, tenantId);
    const multiplier = TIER_MULTIPLIERS[account.tier];
    const points = Math.floor(amount * multiplier); // 1₺ = 1 point * multiplier

    const updated = await this.prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: {
        points: { increment: points },
        totalEarned: { increment: points },
      },
    });

    await this.prisma.loyaltyTransaction.create({
      data: {
        accountId: account.id,
        points,
        type: 'earn',
        source,
        note: `${amount}₺ harcama → ${points} puan (${multiplier}x)`,
      },
    });

    // Check tier upgrade
    await this.checkTierUpgrade(account.id, updated.totalEarned);

    return { pointsEarned: points, totalPoints: updated.points + points };
  }

  async redeemPoints(userId: string, tenantId: string, points: number) {
    const account = await this.getOrCreateAccount(userId, tenantId);

    if (account.points < points) {
      throw new Error('Yetersiz puan');
    }

    const discount = Math.floor(points / 10); // 100 points = ₺10

    await this.prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: {
        points: { decrement: points },
        totalSpent: { increment: points },
      },
    });

    await this.prisma.loyaltyTransaction.create({
      data: {
        accountId: account.id,
        points: -points,
        type: 'redeem',
        note: `${points} puan → ${discount}₺ indirim`,
      },
    });

    return { pointsUsed: points, discountAmount: discount };
  }

  async addBonusPoints(userId: string, tenantId: string, points: number, type: string, note?: string) {
    const account = await this.getOrCreateAccount(userId, tenantId);

    await this.prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: {
        points: { increment: points },
        totalEarned: { increment: points },
      },
    });

    await this.prisma.loyaltyTransaction.create({
      data: {
        accountId: account.id,
        points,
        type,
        note: note || `Bonus: ${points} puan`,
      },
    });

    await this.checkTierUpgrade(account.id, account.totalEarned + points);
  }

  private async checkTierUpgrade(accountId: string, totalEarned: number) {
    let newTier: LoyaltyTier = 'BRONZE';
    if (totalEarned >= TIER_THRESHOLDS.PLATINUM) newTier = 'PLATINUM';
    else if (totalEarned >= TIER_THRESHOLDS.GOLD) newTier = 'GOLD';
    else if (totalEarned >= TIER_THRESHOLDS.SILVER) newTier = 'SILVER';

    await this.prisma.loyaltyAccount.update({
      where: { id: accountId },
      data: { tier: newTier },
    });
  }

  async getLeaderboard(tenantId: string, limit = 10) {
    return this.prisma.loyaltyAccount.findMany({
      where: { tenantId },
      orderBy: { totalEarned: 'desc' },
      take: limit,
    });
  }

  getTierInfo() {
    return {
      tiers: Object.entries(TIER_THRESHOLDS).map(([tier, threshold]) => ({
        tier,
        threshold,
        multiplier: TIER_MULTIPLIERS[tier as LoyaltyTier],
        discount: TIER_DISCOUNTS[tier as LoyaltyTier],
      })),
      redemptionRate: '100 puan = ₺10 indirim',
    };
  }
}
