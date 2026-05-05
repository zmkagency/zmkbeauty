import { Controller, Get, Put, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SchedulesService } from './schedules.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('Schedules')
@Controller('employees/:employeeId/schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  @ApiOperation({ summary: 'Çalışan programını getir' })
  getByEmployee(@Param('employeeId') employeeId: string) {
    return this.schedulesService.getByEmployee(employeeId);
  }

  @Put()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN, Role.STORE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Çalışan programını güncelle (tam hafta)' })
  update(@Param('employeeId') employeeId: string, @Body() schedules: any[]) {
    return this.schedulesService.update(employeeId, schedules);
  }

  @Patch(':dayOfWeek')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN, Role.STORE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Belirli bir günü güncelle' })
  updateDay(
    @Param('employeeId') employeeId: string,
    @Param('dayOfWeek') dayOfWeek: number,
    @Body() data: any,
  ) {
    return this.schedulesService.updateDay(employeeId, dayOfWeek, data);
  }
}
