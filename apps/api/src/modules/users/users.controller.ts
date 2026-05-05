import {
  Controller, Get, Post, Put, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Tüm kullanıcıları listele (Superadmin)' })
  findAll(@Query('role') role?: Role, @Query('tenantId') tenantId?: string, @Query('search') search?: string) {
    return this.usersService.findAll({ role, tenantId, search });
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Yeni kullanıcı oluştur (Superadmin)' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Kendi profil bilgilerini getir' })
  getMe(@CurrentUser('id') userId: string) {
    return this.usersService.findById(userId);
  }

  @Get('tenant/:tenantId/customers')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPERADMIN, Role.STORE_ADMIN)
  @ApiOperation({ summary: 'Mağaza müşterilerini listele' })
  getCustomersByTenant(@Param('tenantId') tenantId: string) {
    return this.usersService.getCustomersByTenant(tenantId);
  }

  @Get('tenant-customers/:customerId')
  @UseGuards(RolesGuard)
  @Roles(Role.STORE_ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Müşteri detaylarını ve LTV bilgilerini getir (CRM)' })
  getTenantCustomerDetails(
    @CurrentUser('tenantId') tenantId: string,
    @Param('customerId') customerId: string
  ) {
    return this.usersService.getTenantCustomerDetails(tenantId, customerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Kullanıcı detayı' })
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put('me')
  @ApiOperation({ summary: 'Kendi profilini güncelle' })
  updateMe(@CurrentUser('id') userId: string, @Body() data: any) {
    return this.usersService.update(userId, data);
  }

  @Patch(':id/toggle-active')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Kullanıcıyı aktif/pasif yap' })
  toggleActive(@Param('id') id: string) {
    return this.usersService.toggleActive(id);
  }

  @Post(':id/reset-password')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kullanıcıya şifre sıfırlama bağlantısı gönder (Superadmin)' })
  adminResetPassword(@Param('id') id: string) {
    return this.usersService.adminTriggerPasswordReset(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Kullanıcı sil (Superadmin). Randevu varsa engellenir.' })
  remove(@Param('id') id: string, @CurrentUser('id') requestingUserId: string) {
    return this.usersService.remove(id, requestingUserId);
  }
}
