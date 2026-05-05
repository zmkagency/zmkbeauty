import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  async log(data: {
    tenantId?: string;
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    details?: any;
    ipAddress?: string;
  }) {
    return this.prisma.auditLog.create({ data });
  }

  async findAll(query?: { tenantId?: string; action?: string; entity?: string; limit?: number }) {
    const where: any = {};
    if (query?.tenantId) where.tenantId = query.tenantId;
    if (query?.action) where.action = query.action;
    if (query?.entity) where.entity = query.entity;

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query?.limit || 50,
    });
  }
}
