import { Controller, Get, Post, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { GiftCardsService } from './gift-cards.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Gift Cards')
@Controller('gift-cards')
export class GiftCardsController {
  constructor(private readonly giftCardsService: GiftCardsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hediye kartı oluştur' })
  create(@Body() body: {
    tenantId?: string;
    amount: number;
    recipientEmail?: string;
    recipientName?: string;
    message?: string;
  }, @CurrentUser('id') userId: string) {
    return this.giftCardsService.create({ ...body, purchaserId: userId });
  }

  @Get('check/:code')
  @ApiOperation({ summary: 'Hediye kartı bakiye sorgula' })
  checkBalance(@Param('code') code: string) {
    return this.giftCardsService.checkBalance(code);
  }

  @Post('redeem/:code')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hediye kartı kullan' })
  redeem(
    @Param('code') code: string,
    @Body() body: { amount: number },
    @CurrentUser('id') userId: string,
  ) {
    return this.giftCardsService.redeem(code, body.amount, userId);
  }

  @Get('tenant/:tenantId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN, Role.STORE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mağaza hediye kartları' })
  getByTenant(@Param('tenantId') tenantId: string) {
    return this.giftCardsService.getByTenant(tenantId);
  }
}
