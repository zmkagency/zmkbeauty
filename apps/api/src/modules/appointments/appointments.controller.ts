import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Req, Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { WalkinAppointmentDto } from './dto/walkin-appointment.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, AppointmentStatus } from '@prisma/client';

@ApiTags('Appointments')
@Controller()
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  // === Public: Get available slots ===
  @Get('tenants/:tenantId/slots')
  @ApiOperation({ summary: 'Müsait randevu saatlerini getir' })
  getSlots(
    @Param('tenantId') tenantId: string,
    @Query('employeeId') employeeId: string,
    @Query('serviceId') serviceId: string,
    @Query('date') date: string,
  ) {
    return this.appointmentsService.getAvailableSlots(tenantId, employeeId, serviceId, date);
  }

  // === Customer: Create appointment ===
  @Post('appointments')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Randevu oluştur' })
  create(@CurrentUser('id') customerId: string, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create({ ...dto, customerId });
  }

  // === Store Admin: Walk-in / manual appointment ===
  @Post('appointments/walkin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN, Role.STORE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manuel/walk-in randevu oluştur (Mağaza)' })
  walkin(@Body() dto: WalkinAppointmentDto) {
    return this.appointmentsService.createWalkin(dto);
  }

  // === Customer: My appointments ===
  @Get('appointments/my')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kendi randevularımı getir' })
  getMyAppointments(@CurrentUser('id') customerId: string) {
    return this.appointmentsService.findByCustomer(customerId);
  }

  // === Store Admin: Tenant appointments (with filters) ===
  @Get('tenants/:tenantId/appointments')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN, Role.STORE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mağaza randevularını listele' })
  getTenantAppointments(
    @Param('tenantId') tenantId: string,
    @Query('status') status?: AppointmentStatus,
    @Query('date') date?: string,
    @Query('employeeId') employeeId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('q') q?: string,
  ) {
    return this.appointmentsService.findByTenant(tenantId, { status, date, employeeId, from, to, q });
  }

  // === Store Admin: CSV export ===
  @Get('tenants/:tenantId/appointments.csv')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN, Role.STORE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Randevuları CSV olarak indir' })
  async exportCsv(
    @Param('tenantId') tenantId: string,
    @Query('status') status: AppointmentStatus | undefined,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Res() res: Response,
  ) {
    const rows = await this.appointmentsService.findByTenant(tenantId, { status, from, to });
    const header = ['Tarih', 'Saat', 'Müşteri', 'E-posta', 'Telefon', 'Hizmet', 'Çalışan', 'Tutar', 'Durum', 'Ödeme'];
    const escape = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = rows.map((r: any) =>
      [
        r.date.toISOString().slice(0, 10),
        r.startTime,
        `${r.customer?.firstName} ${r.customer?.lastName}`.trim(),
        r.customer?.email || '',
        r.customer?.phone || '',
        r.service?.name || '',
        `${r.employee?.firstName} ${r.employee?.lastName}`.trim(),
        Number(r.totalPrice).toFixed(2),
        r.status,
        r.payment?.status || '—',
      ]
        .map(escape)
        .join(','),
    );
    const csv = '﻿' + [header.map(escape).join(','), ...lines].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="randevular-${Date.now()}.csv"`);
    res.send(csv);
  }

  // === Superadmin: All appointments ===
  @Get('appointments')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tüm randevuları listele (Superadmin)' })
  getAllAppointments(
    @Query('status') status?: AppointmentStatus,
    @Query('tenantId') tenantId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('q') q?: string,
  ) {
    return this.appointmentsService.getAllAppointments({ status, tenantId, from, to, q });
  }

  // === Get single appointment ===
  @Get('appointments/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Randevu detayı' })
  findById(@Param('id') id: string) {
    return this.appointmentsService.findById(id);
  }

  // === Update appointment status ===
  @Patch('appointments/:id/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN, Role.STORE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Randevu durumunu güncelle (tamamlandı / gelmedi vb.)' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateAppointmentStatusDto) {
    return this.appointmentsService.updateStatus(id, dto.status);
  }

  // === Reschedule appointment ===
  @Patch('appointments/:id/reschedule')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Randevuyu ertele' })
  reschedule(
    @Param('id') id: string,
    @Body() dto: RescheduleAppointmentDto,
    @CurrentUser() user: { id: string; role: Role; tenantId?: string | null },
  ) {
    return this.appointmentsService.reschedule(id, user, dto);
  }

  // === Cancel appointment ===
  @Patch('appointments/:id/cancel')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Randevuyu iptal et' })
  cancel(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: Role; tenantId?: string | null },
  ) {
    return this.appointmentsService.cancel(id, user);
  }
}
