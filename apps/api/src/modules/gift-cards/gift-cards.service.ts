import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GiftCardsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    tenantId?: string;
    amount: number;
    purchaserId?: string;
    recipientEmail?: string;
    recipientName?: string;
    message?: string;
    expiresAt?: string;
  }) {
    const code = this.generateCode();
    return this.prisma.giftCard.create({
      data: {
        ...data,
        code,
        balance: data.amount,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });
  }

  async findByCode(code: string) {
    const card = await this.prisma.giftCard.findUnique({ where: { code } });
    if (!card) throw new NotFoundException('Hediye kartı bulunamadı');
    return card;
  }

  async redeem(code: string, amount: number, userId: string) {
    const card = await this.findByCode(code);

    if (!card.isActive) throw new BadRequestException('Bu hediye kartı aktif değil');
    if (card.expiresAt && card.expiresAt < new Date()) throw new BadRequestException('Hediye kartı süresi dolmuş');
    if (Number(card.balance) < amount) throw new BadRequestException('Yetersiz bakiye');

    const newBalance = Number(card.balance) - amount;

    return this.prisma.giftCard.update({
      where: { code },
      data: {
        balance: newBalance,
        redeemedAt: newBalance === 0 ? new Date() : card.redeemedAt,
        redeemedBy: userId,
      },
    });
  }

  async getByTenant(tenantId: string) {
    return this.prisma.giftCard.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async checkBalance(code: string) {
    const card = await this.findByCode(code);
    return {
      code: card.code,
      balance: card.balance,
      isActive: card.isActive,
      expired: card.expiresAt ? card.expiresAt < new Date() : false,
    };
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'ZMK-';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
