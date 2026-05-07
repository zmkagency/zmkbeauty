import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MobileService {
  constructor(private prisma: PrismaService) {}

  async getHome(userId: string) {
    const [user, upcomingAppointments, recentSalons, featuredSalons] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true, email: true, firstName: true, lastName: true,
          phone: true, avatarUrl: true, tenantId: true,
          tenant: { select: { id: true, name: true, slug: true, logo: true, city: true } },
        },
      }),
      this.prisma.appointment.findMany({
        where: {
          customerId: userId,
          status: { in: ['PENDING_PAYMENT', 'CONFIRMED'] },
          date: { gte: new Date() },
        },
        include: {
          tenant: { select: { id: true, name: true, slug: true, logo: true } },
          service: { select: { name: true, duration: true } },
          employee: { select: { firstName: true, lastName: true } },
        },
        orderBy: { date: 'asc' },
        take: 5,
      }),
      this.getRecentSalons(userId),
      this.prisma.tenant.findMany({
        where: { isActive: true },
        select: {
          id: true, name: true, slug: true, logo: true, coverImage: true,
          city: true, district: true, shortDescription: true,
          _count: { select: { services: true, employees: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return {
      user,
      upcomingAppointments,
      recentSalons,
      featuredSalons,
    };
  }

  async getRecentSalons(userId: string) {
    const appointments = await this.prisma.appointment.findMany({
      where: { customerId: userId },
      select: {
        tenantId: true,
        date: true,
        tenant: {
          select: {
            id: true, name: true, slug: true, logo: true, coverImage: true,
            city: true, shortDescription: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 20,
    });

    const seen = new Set<string>();
    const unique: any[] = [];
    for (const appt of appointments) {
      if (!seen.has(appt.tenantId)) {
        seen.add(appt.tenantId);
        unique.push({ ...appt.tenant, lastVisit: appt.date });
      }
    }
    return unique.slice(0, 5);
  }

  async getMyAppointments(userId: string, filter?: 'upcoming' | 'past' | 'all') {
    const where: any = { customerId: userId };
    if (filter === 'upcoming') {
      where.date = { gte: new Date() };
      where.status = { in: ['PENDING_PAYMENT', 'CONFIRMED'] };
    } else if (filter === 'past') {
      where.OR = [
        { date: { lt: new Date() } },
        { status: { in: ['COMPLETED', 'CANCELLED'] } },
      ];
    }

    return this.prisma.appointment.findMany({
      where,
      include: {
        tenant: { select: { id: true, name: true, slug: true, logo: true, city: true, phone: true } },
        service: { select: { name: true, duration: true, price: true } },
        employee: { select: { firstName: true, lastName: true, title: true } },
        payment: { select: { status: true, amount: true } },
      },
      orderBy: { date: filter === 'past' ? 'desc' : 'asc' },
    });
  }

  async getMyLoyalty(userId: string) {
    const accounts = await this.prisma.loyaltyAccount.findMany({
      where: { userId },
      include: {
        transactions: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    const tenantIds = accounts.map(a => a.tenantId);
    const tenants = await this.prisma.tenant.findMany({
      where: { id: { in: tenantIds } },
      select: { id: true, name: true, slug: true, logo: true },
    });

    return accounts.map(acc => ({
      ...acc,
      tenant: tenants.find(t => t.id === acc.tenantId),
    }));
  }

  async getMyPackages(userId: string) {
    return this.prisma.customerPackage.findMany({
      where: {
        userId,
        remaining: { gt: 0 },
        expiresAt: { gt: new Date() },
      },
      include: {
        package: {
          include: {
            // service relation via serviceId
          },
        },
      },
      orderBy: { expiresAt: 'asc' },
    });
  }

  async updateProfile(userId: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatarUrl?: string;
    birthDate?: string;
  }) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
      },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, avatarUrl: true, birthDate: true,
      },
    });
  }

  async registerDevice(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const existing = user.deviceTokens || [];
    if (existing.includes(token)) return;

    return this.prisma.user.update({
      where: { id: userId },
      data: { deviceTokens: [...existing, token].slice(-5) }, // keep last 5
    });
  }

  async searchSalons(query?: string, city?: string) {
    return this.prisma.tenant.findMany({
      where: {
        isActive: true,
        ...(city && { city: { contains: city, mode: 'insensitive' as const } }),
        ...(query && {
          OR: [
            { name: { contains: query, mode: 'insensitive' as const } },
            { shortDescription: { contains: query, mode: 'insensitive' as const } },
          ],
        }),
      },
      select: {
        id: true, name: true, slug: true, logo: true, coverImage: true,
        city: true, district: true, shortDescription: true, phone: true,
        _count: { select: { services: true, employees: true, reviews: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
