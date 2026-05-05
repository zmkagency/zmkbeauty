import { Controller, Get, Post, Body, Param, Put, Delete, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProductsService } from './products.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('tenant/:tenantId')
  @ApiOperation({ summary: 'Bir mağazanın tüm ürünlerini getir (Public)' })
  findAllByTenantPublic(@Param('tenantId') tenantId: string) {
    return this.productsService.findAllByTenant(tenantId);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('STORE_ADMIN')
  @ApiOperation({ summary: 'Mağaza ürünlerini getir (Admin)' })
  findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.productsService.findAllByTenant(tenantId);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('STORE_ADMIN')
  @ApiOperation({ summary: 'Yeni ürün ekle' })
  create(@CurrentUser('tenantId') tenantId: string, @Body() data: any) {
    return this.productsService.create(tenantId, data);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('STORE_ADMIN')
  @ApiOperation({ summary: 'Ürün güncelle' })
  update(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string, @Body() data: any) {
    return this.productsService.update(tenantId, id, data);
  }

  @Patch(':id/stock')
  @UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('STORE_ADMIN')
  @ApiOperation({ summary: 'Ürün stok güncelle' })
  updateStock(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string, @Body('stock') stock: number) {
    return this.productsService.updateStock(tenantId, id, stock);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('STORE_ADMIN')
  @ApiOperation({ summary: 'Ürün sil' })
  remove(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.productsService.remove(tenantId, id);
  }
}