import {
  Controller, Get, Post, Patch, Param, Body, UseGuards, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SubscriptionsService } from './subscriptions.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role, SubscriptionTier } from '@prisma/client';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Mevcut planları listele' })
  getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @Get(':tenantId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN, Role.STORE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mağaza abonelik bilgisi' })
  getSubscription(@Param('tenantId') tenantId: string) {
    return this.subscriptionsService.getSubscription(tenantId);
  }

  @Get(':tenantId/limits')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN, Role.STORE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Plan limit kontrolü' })
  checkLimits(@Param('tenantId') tenantId: string) {
    return this.subscriptionsService.checkLimits(tenantId);
  }

  @Post(':tenantId/upgrade')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN, Role.STORE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Plan yükselt' })
  upgrade(
    @Param('tenantId') tenantId: string,
    @Body() body: { tier: SubscriptionTier; billingCycle: 'monthly' | 'yearly' },
  ) {
    return this.subscriptionsService.createOrUpgrade(tenantId, body.tier, body.billingCycle);
  }

  @Patch(':tenantId/cancel')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN, Role.STORE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Abonelik iptal' })
  cancel(@Param('tenantId') tenantId: string) {
    return this.subscriptionsService.cancel(tenantId);
  }
}
