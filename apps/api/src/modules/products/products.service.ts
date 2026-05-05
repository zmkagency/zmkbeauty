import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: any) {
    return this.prisma.product.create({
      data: {
        ...data,
        tenantId,
      }
    });
  }

  async findAllByTenant(tenantId: string) {
    return this.prisma.product.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async update(tenantId: string, id: string, data: any) {
    const product = await this.prisma.product.findUnique({ where: { id, tenantId } });
    if (!product) throw new NotFoundException('Ürün bulunamadı');

    return this.prisma.product.update({
      where: { id },
      data
    });
  }

  async remove(tenantId: string, id: string) {
    const product = await this.prisma.product.findUnique({ where: { id, tenantId } });
    if (!product) throw new NotFoundException('Ürün bulunamadı');

    return this.prisma.product.delete({ where: { id } });
  }

  async updateStock(tenantId: string, id: string, stock: number) {
    const product = await this.prisma.product.findUnique({ where: { id, tenantId } });
    if (!product) throw new NotFoundException('Ürün bulunamadı');

    return this.prisma.product.update({
      where: { id },
      data: { stock }
    });
  }
}