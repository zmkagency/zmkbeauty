import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CampaignsService } from './campaigns.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Campaigns')
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  // === Public: validate coupon code (used by booking page) ===
  @Get('validate')
  @ApiOperation({ summary: 'Kupon kodunu doğrula (public)' })
  validate(
    @Query('tenantId') tenantId: string,
    @Query('code') code: string,
    @Query('amount') amount: string,
  ) {
    return this.campaignsService.validateCode(tenantId, code, Number(amount) || 0);
  }

  // === Store admin: list & manage ===
  @Post()
  @UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('STORE_ADMIN')
  create(@CurrentUser('tenantId') tenantId: string, @Body() data: any) {
    return this.campaignsService.create(tenantId, data);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('STORE_ADMIN')
  findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.campaignsService.findAll(tenantId);
  }

  @Patch(':id/toggle')
  @UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('STORE_ADMIN')
  toggle(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.campaignsService.toggleActive(id, tenantId);
  }
}
