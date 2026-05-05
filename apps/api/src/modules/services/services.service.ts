import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateServiceDto) {
    return this.prisma.service.create({
      data: { ...dto, tenantId },
    });
  }

  async findAllByTenant(tenantId: string, category?: string) {
    const where: any = { tenantId, isActive: true };
    if (category) where.category = category;

    return this.prisma.service.findMany({
      where,
      include: {
        employees: {
          include: {
            employee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findById(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        employees: {
          include: {
            employee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, title: true } },
          },
        },
      },
    });
    if (!service) throw new NotFoundException('Hizmet bulunamadı');
    return service;
  }

  async update(id: string, data: Partial<CreateServiceDto>) {
    await this.findById(id);
    return this.prisma.service.update({ where: { id }, data });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.service.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getCategories(tenantId: string) {
    const services = await this.prisma.service.findMany({
      where: { tenantId, isActive: true, category: { not: null } },
      select: { category: true },
      distinct: ['category'],
    });
    return services.map((s) => s.category).filter(Boolean);
  }
}
