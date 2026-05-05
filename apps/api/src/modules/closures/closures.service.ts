import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ClosuresService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: { date: string; reason?: string; isFullDay?: boolean; startTime?: string; endTime?: string }) {
    const date = new Date(data.date);

    try {
      return await this.prisma.storeClosure.create({
        data: {
          tenantId,
          date,
          reason: data.reason,
          isFullDay: data.isFullDay ?? true,
          startTime: data.startTime,
          endTime: data.endTime,
        },
      });
    } catch {
      throw new ConflictException('Bu tarih zaten kapalı gün olarak işaretlenmiş');
    }
  }

  async findByTenant(tenantId: string) {
    return this.prisma.storeClosure.findMany({
      where: { tenantId, date: { gte: new Date() } },
      orderBy: { date: 'asc' },
    });
  }

  async delete(id: string) {
    return this.prisma.storeClosure.delete({ where: { id } });
  }

  async isClosedOnDate(tenantId: string, date: Date): Promise<boolean> {
    const closure = await this.prisma.storeClosure.findUnique({
      where: { tenantId_date: { tenantId, date } },
    });
    return !!closure;
  }
}
