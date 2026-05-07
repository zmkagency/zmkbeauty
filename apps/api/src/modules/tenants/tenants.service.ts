import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTenantDto) {
    // Check slug uniqueness
    const existing = await this.prisma.tenant.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException('Bu mağaza URL adresi zaten kullanılmaktadır');
    }

    return this.prisma.tenant.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        shortDescription: dto.shortDescription,
        address: dto.address,
        phone: dto.phone,
        email: dto.email,
        city: dto.city,
        district: dto.district,
        latitude: dto.latitude,
        longitude: dto.longitude,
        workingHours: dto.workingHours,
        socialLinks: dto.socialLinks,
        themeColor: dto.themeColor,
        seoTitle: dto.seoTitle,
        seoDescription: dto.seoDescription,
        bufferMinutes: dto.bufferMinutes,
      },
    });
  }

  async advancedSearch(query: { q?: string; city?: string; district?: string; minRating?: number; services?: string[] }) {
    const where: any = { isActive: true };

    if (query.city) where.city = { equals: query.city, mode: 'insensitive' };
    if (query.district) where.district = { equals: query.district, mode: 'insensitive' };
    
    if (query.q) {
      where.OR = [
        { name: { search: query.q.split(' ').join(' & ') } },
        { description: { search: query.q.split(' ').join(' & ') } },
        { shortDescription: { search: query.q.split(' ').join(' & ') } },
      ];
    }

    if (query.services && query.services.length > 0) {
      where.services = {
        some: {
          id: { in: query.services }
        }
      };
    }

    const tenants = await this.prisma.tenant.findMany({
      where,
      include: {
        services: { select: { id: true, name: true, price: true, currency: true } },
        reviews: { select: { rating: true } },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    });

    // Calculate average rating and filter if minRating is provided
    let results = tenants.map(tenant => {
      const totalRating = tenant.reviews.reduce((sum, review) => sum + review.rating, 0);
      const avgRating = tenant.reviews.length > 0 ? totalRating / tenant.reviews.length : 0;
      return {
        ...tenant,
        avgRating,
      };
    });

    if (query.minRating) {
      results = results.filter(t => t.avgRating >= query.minRating!);
    }

    return results;
  }

  async findAll(query?: { city?: string; isActive?: boolean; search?: string }) {
    const where: any = {};

    if (query?.city) where.city = query.city;
    if (query?.isActive !== undefined) where.isActive = query.isActive;
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { city: { contains: query.search, mode: 'insensitive' } },
        { district: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.tenant.findMany({
      where,
      include: {
        _count: {
          select: {
            services: true,
            employees: true,
            appointments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        services: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        employees: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        _count: {
          select: {
            appointments: true,
            payments: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Mağaza bulunamadı');
    }

    return tenant;
  }

  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        employees: {
          where: { isActive: true },
          include: {
            services: {
              include: { service: true },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Mağaza bulunamadı');
    }

    return tenant;
  }

  async findByDomain(domain: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { customDomain: domain },
      select: { slug: true },
    });
    if (!tenant) throw new NotFoundException('Domain bulunamadı');
    return tenant;
  }

  async updateDomain(id: string, domain: string | null) {
    if (domain) {
      const existing = await this.prisma.tenant.findFirst({
        where: { customDomain: domain, id: { not: id } },
      });
      if (existing) throw new ConflictException('Bu domain zaten başka bir mağaza tarafından kullanılıyor');
    }
    return this.prisma.tenant.update({
      where: { id },
      data: { customDomain: domain, domainVerified: false },
    });
  }

  async update(id: string, dto: UpdateTenantDto) {
    await this.findById(id); // Check existence

    if (dto.slug) {
      const existing = await this.prisma.tenant.findFirst({
        where: { slug: dto.slug, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Bu mağaza URL adresi zaten kullanılmaktadır');
      }
    }

    return this.prisma.tenant.update({
      where: { id },
      data: dto,
    });
  }

  async toggleActive(id: string) {
    const tenant = await this.findById(id);
    return this.prisma.tenant.update({
      where: { id },
      data: { isActive: !tenant.isActive },
    });
  }

  async checkSlugAvailability(slug: string, excludeId?: string) {
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      return { available: false, reason: 'invalid' as const };
    }
    const existing = await this.prisma.tenant.findFirst({
      where: excludeId ? { slug, id: { not: excludeId } } : { slug },
      select: { id: true },
    });
    return { available: !existing, reason: existing ? ('taken' as const) : null };
  }

  async remove(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: { appointments: true, payments: true },
        },
      },
    });
    if (!tenant) throw new NotFoundException('Mağaza bulunamadı');
    if (tenant._count.appointments > 0 || tenant._count.payments > 0) {
      throw new BadRequestException(
        'Randevu veya ödeme kaydı bulunan mağaza silinemez. Önce pasife alın.',
      );
    }
    await this.prisma.tenant.delete({ where: { id } });
    return { success: true };
  }

  async getDashboardStats(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalCustomers,
      todayAppointments,
      totalAppointments,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.user.count({
        where: { tenantId, role: 'CUSTOMER' },
      }),
      this.prisma.appointment.count({
        where: {
          tenantId,
          date: { gte: today, lt: tomorrow },
          status: { in: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] },
        },
      }),
      this.prisma.appointment.count({
        where: { tenantId },
      }),
      this.prisma.payment.aggregate({
        where: { tenantId, status: 'SUCCESS' },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalCustomers,
      todayAppointments,
      totalAppointments,
      totalRevenue: totalRevenue._sum.amount || 0,
    };
  }
}
