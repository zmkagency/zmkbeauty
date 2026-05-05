import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('superadmin')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Superadmin dashboard KPIs' })
  getSuperadminDashboard() {
    return this.dashboardService.getSuperadminDashboard();
  }

  @Get('store/:tenantId')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPERADMIN, Role.STORE_ADMIN)
  @ApiOperation({ summary: 'Mağaza dashboard KPIs' })
  getStoreDashboard(@Param('tenantId') tenantId: string) {
    return this.dashboardService.getStoreDashboard(tenantId);
  }

  @Get('analytics')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPERADMIN, Role.STORE_ADMIN)
  @ApiOperation({ summary: 'Gelişmiş analitik verileri' })
  getAnalytics(
    @CurrentUser('tenantId') tenantId: string,
    @Query('range') range: string
  ) {
    return this.dashboardService.getAdvancedAnalytics(tenantId, range);
  }
}
