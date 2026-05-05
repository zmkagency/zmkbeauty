import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DiscountType, Prisma } from '@prisma/client';

@Injectable()
export class CampaignsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: any) {
    return this.prisma.campaign.create({
      data: {
        ...data,
        tenantId,
        discountType: data.discountType as DiscountType,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.campaign.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleActive(id: string, tenantId: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id, tenantId } });
    if (!campaign) throw new NotFoundException('Kampanya bulunamadı');
    return this.prisma.campaign.update({
      where: { id },
      data: { isActive: !campaign.isActive },
    });
  }

  /**
   * Validate a coupon code for a given tenant + cart amount.
   * Public (no auth) — but tenant-scoped via tenantId so a code from one
   * store cannot be applied at another.
   *
   * Returns null when invalid; otherwise the campaign + computed discount.
   */
  async validateCode(tenantId: string, code: string, totalAmount: number) {
    if (!code) throw new BadRequestException('Kupon kodu gerekli');
    const normalized = code.trim().toUpperCase();
    const now = new Date();

    const campaign = await this.prisma.campaign.findFirst({
      where: {
        tenantId,
        code: { equals: normalized, mode: 'insensitive' },
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });
    if (!campaign) throw new NotFoundException('Geçersiz veya süresi dolmuş kupon');

    if (campaign.maxUsage !== null && campaign.maxUsage !== undefined) {
      if (campaign.usedCount >= campaign.maxUsage) {
        throw new BadRequestException('Bu kupon kullanım limitine ulaştı');
      }
    }

    if (campaign.minSpend && totalAmount < Number(campaign.minSpend)) {
      throw new BadRequestException(
        `Minimum ${Number(campaign.minSpend).toLocaleString('tr-TR')} ₺ harcama gerekli`,
      );
    }

    const discount = this.computeDiscount(
      campaign.discountType,
      Number(campaign.discountValue),
      totalAmount,
    );

    return {
      campaign: {
        id: campaign.id,
        title: campaign.title,
        code: campaign.code,
        discountType: campaign.discountType,
        discountValue: Number(campaign.discountValue),
      },
      discount,
      finalAmount: Math.max(0, totalAmount - discount),
    };
  }

  /**
   * Returns the effective discount amount in TRY for a given cart total.
   */
  computeDiscount(type: DiscountType, value: number, totalAmount: number): number {
    if (type === DiscountType.PERCENTAGE) {
      return Math.min(totalAmount, Math.round((totalAmount * value) / 100 * 100) / 100);
    }
    return Math.min(totalAmount, value);
  }

  /**
   * Atomically increment usedCount when an appointment successfully applies
   * the campaign. Called by AppointmentsService.
   */
  async incrementUsage(id: string) {
    return this.prisma.campaign
      .update({
        where: { id },
        data: { usedCount: { increment: 1 } },
      })
      .catch(() => null);
  }
}
