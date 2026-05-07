import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PackagesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: {
    name: string;
    description?: string;
    serviceId: string;
    sessionCount: number;
    price: number;
    validDays?: number;
  }) {
    return this.prisma.package.create({
      data: { tenantId, ...data },
    });
  }

  async findAllByTenant(tenantId: string) {
    return this.prisma.package.findMany({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async purchase(packageId: string, userId: string, tenantId: string) {
    const pkg = await this.prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg || !pkg.isActive) throw new NotFoundException('Paket bulunamadı');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + pkg.validDays);

    return this.prisma.customerPackage.create({
      data: {
        packageId,
        userId,
        tenantId,
        remaining: pkg.sessionCount,
        expiresAt,
      },
    });
  }

  async getCustomerPackages(userId: string, tenantId: string) {
    return this.prisma.customerPackage.findMany({
      where: { userId, tenantId, remaining: { gt: 0 }, expiresAt: { gt: new Date() } },
      include: { package: true },
      orderBy: { expiresAt: 'asc' },
    });
  }

  async useSession(customerPackageId: string) {
    const cp = await this.prisma.customerPackage.findUnique({ where: { id: customerPackageId } });
    if (!cp) throw new NotFoundException('Paket bulunamadı');
    if (cp.remaining <= 0) throw new BadRequestException('Kalan hak yok');
    if (cp.expiresAt < new Date()) throw new BadRequestException('Paket süresi dolmuş');

    return this.prisma.customerPackage.update({
      where: { id: customerPackageId },
      data: { remaining: { decrement: 1 } },
    });
  }

  async update(id: string, data: Partial<{ name: string; price: number; sessionCount: number; validDays: number; isActive: boolean }>) {
    return this.prisma.package.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.package.update({ where: { id }, data: { isActive: false } });
  }
}
