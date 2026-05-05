import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yeni mağaza oluştur (Superadmin)' })
  async create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Mağazaları listele' })
  async findAll(
    @Query('city') city?: string,
    @Query('isActive') isActive?: boolean,
    @Query('search') search?: string,
  ) {
    return this.tenantsService.findAll({ city, isActive, search });
  }

  @Get('search')
  @ApiOperation({ summary: 'Gelişmiş Mağaza Arama (ElasticSearch mantığı)' })
  async advancedSearch(
    @Query('q') q?: string,
    @Query('city') city?: string,
    @Query('district') district?: string,
    @Query('minRating') minRating?: string,
    @Query('services') services?: string,
  ) {
    const serviceIds = services ? services.split(',') : [];
    const minRatingNum = minRating ? parseFloat(minRating) : undefined;
    return this.tenantsService.advancedSearch({
      q,
      city,
      district,
      minRating: minRatingNum,
      services: serviceIds
    });
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Mağazayı slug ile getir (public mini-site)' })
  async findBySlug(@Param('slug') slug: string) {
    return this.tenantsService.findBySlug(slug);
  }

  @Get('check-slug/:slug')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Slug müsaitlik kontrolü' })
  async checkSlug(
    @Param('slug') slug: string,
    @Query('excludeId') excludeId?: string,
  ) {
    return this.tenantsService.checkSlugAvailability(slug, excludeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mağaza detayını getir' })
  async findById(@Param('id') id: string) {
    return this.tenantsService.findById(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN, Role.STORE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mağaza güncelle' })
  async update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(id, dto);
  }

  @Patch(':id/toggle-active')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mağazayı aktif/pasif yap' })
  async toggleActive(@Param('id') id: string) {
    return this.tenantsService.toggleActive(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mağaza sil (Superadmin). Randevu/ödeme varsa engellenir.' })
  async remove(@Param('id') id: string) {
    return this.tenantsService.remove(id);
  }

  @Get(':id/dashboard')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN, Role.STORE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mağaza dashboard istatistikleri' })
  async getDashboardStats(@Param('id') id: string) {
    return this.tenantsService.getDashboardStats(id);
  }
}
