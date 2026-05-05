import {
  Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('Services')
@Controller('tenants/:tenantId/services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN, Role.STORE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yeni hizmet ekle' })
  create(@Param('tenantId') tenantId: string, @Body() dto: CreateServiceDto) {
    return this.servicesService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Mağaza hizmetlerini listele' })
  findAll(@Param('tenantId') tenantId: string, @Query('category') category?: string) {
    return this.servicesService.findAllByTenant(tenantId, category);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Hizmet kategorilerini getir' })
  getCategories(@Param('tenantId') tenantId: string) {
    return this.servicesService.getCategories(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Hizmet detayı' })
  findById(@Param('id') id: string) {
    return this.servicesService.findById(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN, Role.STORE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hizmet güncelle' })
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN, Role.STORE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hizmet sil (soft delete)' })
  delete(@Param('id') id: string) {
    return this.servicesService.delete(id);
  }
}
