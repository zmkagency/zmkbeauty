import {
  Controller, Get, Post, Put, Delete, Param, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PackagesService } from './packages.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Packages')
@Controller('tenants/:tenantId/packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN, Role.STORE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yeni paket oluştur' })
  create(@Param('tenantId') tenantId: string, @Body() body: {
    name: string;
    description?: string;
    serviceId: string;
    sessionCount: number;
    price: number;
    validDays?: number;
  }) {
    return this.packagesService.create(tenantId, body);
  }

  @Get()
  @ApiOperation({ summary: 'Mağaza paketlerini listele' })
  findAll(@Param('tenantId') tenantId: string) {
    return this.packagesService.findAllByTenant(tenantId);
  }

  @Post(':packageId/purchase')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Paket satın al' })
  purchase(
    @Param('tenantId') tenantId: string,
    @Param('packageId') packageId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.packagesService.purchase(packageId, userId, tenantId);
  }

  @Get('my-packages')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Müşterinin paketleri' })
  getMyPackages(@Param('tenantId') tenantId: string, @CurrentUser('id') userId: string) {
    return this.packagesService.getCustomerPackages(userId, tenantId);
  }

  @Post('use/:customerPackageId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN, Role.STORE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Paket seansı kullan' })
  useSession(@Param('customerPackageId') customerPackageId: string) {
    return this.packagesService.useSession(customerPackageId);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN, Role.STORE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Paket güncelle' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.packagesService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN, Role.STORE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Paket sil' })
  delete(@Param('id') id: string) {
    return this.packagesService.delete(id);
  }
}
