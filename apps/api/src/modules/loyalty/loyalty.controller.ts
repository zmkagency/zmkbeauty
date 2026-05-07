import {
  Controller, Get, Post, Param, Body, UseGuards, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LoyaltyService } from './loyalty.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Loyalty')
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('tiers')
  @ApiOperation({ summary: 'Sadakat katmanları bilgisi' })
  getTierInfo() {
    return this.loyaltyService.getTierInfo();
  }

  @Get(':tenantId/account')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Müşteri sadakat hesabı' })
  getAccount(@Param('tenantId') tenantId: string, @CurrentUser('id') userId: string) {
    return this.loyaltyService.getOrCreateAccount(userId, tenantId);
  }

  @Post(':tenantId/redeem')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Puan kullan' })
  redeem(
    @Param('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { points: number },
  ) {
    return this.loyaltyService.redeemPoints(userId, tenantId, body.points);
  }

  @Get(':tenantId/leaderboard')
  @ApiOperation({ summary: 'Sadakat sıralaması' })
  getLeaderboard(@Param('tenantId') tenantId: string) {
    return this.loyaltyService.getLeaderboard(tenantId);
  }
}
