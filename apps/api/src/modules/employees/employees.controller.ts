import {
  Controller, Get, Post, Put, Delete, Param, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('Employees')
@Controller('tenants/:tenantId/employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN, Role.STORE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yeni çalışan ekle' })
  create(@Param('tenantId') tenantId: string, @Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Mağaza çalışanlarını listele' })
  findAll(@Param('tenantId') tenantId: string) {
    return this.employeesService.findAllByTenant(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Çalışan detayı' })
  findById(@Param('id') id: string) {
    return this.employeesService.findById(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN, Role.STORE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Çalışan güncelle' })
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employeesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN, Role.STORE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Çalışan sil' })
  delete(@Param('id') id: string) {
    return this.employeesService.delete(id);
  }

  @Post(':id/leaves')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN, Role.STORE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Çalışana izin ekle' })
  addLeave(@Param('id') id: string, @Body() dto: CreateLeaveDto) {
    return this.employeesService.addLeave(id, dto);
  }

  @Get(':id/leaves')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN, Role.STORE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Çalışan izinlerini listele' })
  getLeaves(@Param('id') id: string) {
    return this.employeesService.getLeaves(id);
  }

  @Delete('leaves/:leaveId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN, Role.STORE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Çalışan izni sil' })
  removeLeave(@Param('leaveId') leaveId: string) {
    return this.employeesService.removeLeave(leaveId);
  }
}
