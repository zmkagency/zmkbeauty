import { Controller, Get, Post, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { WaitlistService } from './waitlist.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Waitlist')
@Controller('tenants/:tenantId/waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bekleme listesine ekle' })
  add(
    @Param('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { serviceId: string; date: string; employeeId?: string },
  ) {
    return this.waitlistService.addToWaitlist(tenantId, userId, body.serviceId, body.date, body.employeeId);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bekleme listesi (tarih bazlı)' })
  getForDate(@Param('tenantId') tenantId: string, @Query('date') date: string) {
    return this.waitlistService.getWaitlistForDate(tenantId, date);
  }

  @Get('my')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Benim bekleme listem' })
  getMy(@Param('tenantId') tenantId: string, @CurrentUser('id') userId: string) {
    return this.waitlistService.getMyWaitlist(userId, tenantId);
  }
}
