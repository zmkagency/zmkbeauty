import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private configService: ConfigService,
  ) {}

  async findAll(query?: { role?: Role; tenantId?: string; search?: string }) {
    const where: any = {};
    if (query?.role) where.role = query.role;
    if (query?.tenantId) where.tenantId = query.tenantId;
    if (query?.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        tenantId: true,
        avatarUrl: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        tenant: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        tenantId: true,
        avatarUrl: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        appointments: {
          orderBy: { date: 'desc' },
          take: 10,
          include: {
            service: { select: { name: true, price: true } },
            employee: { select: { firstName: true, lastName: true } },
            tenant: { select: { name: true, slug: true } },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');
    return user;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Bu e-posta zaten kayıtlı');

    if (dto.tenantId) {
      const tenant = await this.prisma.tenant.findUnique({ where: { id: dto.tenantId } });
      if (!tenant) throw new NotFoundException('Mağaza bulunamadı');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        passwordHash,
        role: dto.role,
        tenantId: dto.tenantId || null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        tenantId: true,
        createdAt: true,
      },
    });

    // Fire-and-forget welcome email
    this.notifications
      .sendWelcomeEmail({ email: user.email, firstName: user.firstName })
      .catch(() => {});

    return user;
  }

  async update(id: string, data: { firstName?: string; lastName?: string; phone?: string; avatarUrl?: string }) {
    await this.findById(id);
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        avatarUrl: true,
      },
    });
  }

  async toggleActive(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');
    return this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });
  }

  /**
   * Superadmin action: generate a password reset token and email it.
   * Reuses the same PasswordResetToken flow as self-service forgot-password.
   */
  async adminTriggerPasswordReset(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');

    // Invalidate any existing unused tokens
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 60);

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const webUrl = this.configService.get<string>('WEB_URL') || 'http://localhost:3000';
    const resetUrl = `${webUrl}/reset-password?token=${token}`;

    await this.notifications
      .sendPasswordReset({ email: user.email, firstName: user.firstName, resetUrl })
      .catch(() => {});

    return {
      message: 'Şifre sıfırlama bağlantısı kullanıcıya e-posta ile gönderildi',
      email: user.email,
    };
  }

  async remove(id: string, requestingUserId: string) {
    if (id === requestingUserId) {
      throw new BadRequestException('Kendi hesabınızı silemezsiniz');
    }
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: { select: { appointments: true } },
        employee: { select: { id: true } },
      },
    });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');
    if (user._count.appointments > 0) {
      throw new BadRequestException(
        'Randevu geçmişi bulunan kullanıcı silinemez. Bunun yerine pasife alın.',
      );
    }
    if (user.employee) {
      throw new BadRequestException(
        'Bu kullanıcı bir çalışan kaydına bağlı. Önce çalışan kaydını silin veya bağlantıyı kaldırın.',
      );
    }
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }

  async getCustomersByTenant(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId, role: Role.CUSTOMER },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
        lastLoginAt: true,
        _count: { select: { appointments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTenantCustomerDetails(tenantId: string, customerId: string) {
    const customer = await this.prisma.user.findFirst({
      where: { id: customerId, appointments: { some: { tenantId } } },
      include: {
        appointments: {
          where: { tenantId },
          include: { service: true, employee: true },
          orderBy: { date: 'desc' }
        },
        reviews: {
          where: { tenantId }
        }
      }
    });

    if (!customer) throw new NotFoundException('Müşteri bulunamadı');

    const ltv = customer.appointments
      .filter(a => a.status === 'COMPLETED')
      .reduce((sum, a) => sum + Number(a.totalPrice), 0);

    return { ...customer, ltv };
  }
}
