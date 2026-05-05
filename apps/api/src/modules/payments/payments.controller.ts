import { Controller, Get, Post, Param, Body, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { PaymentsService } from './payments.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, PaymentStatus } from '@prisma/client';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initiate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ödeme başlat' })
  initiatePayment(
    @Body('appointmentId') appointmentId: string,
    @CurrentUser('id') userId: string,
    @Body('ip') ip?: string,
  ) {
    return this.paymentsService.initiatePayment(appointmentId, userId, ip);
  }

  @Post('callback')
  @ApiOperation({ summary: 'PayTR callback (webhook)' })
  handleCallback(@Body() payload: any) {
    return this.paymentsService.handleCallback(payload);
  }

  @Get('tenant/:tenantId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN, Role.STORE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mağaza ödemelerini listele' })
  findByTenant(
    @Param('tenantId') tenantId: string,
    @Query('status') status?: PaymentStatus,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('q') q?: string,
  ) {
    return this.paymentsService.findByTenant(tenantId, { status, from, to, q });
  }

  @Get('tenant/:tenantId/summary')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN, Role.STORE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mağaza ödeme özeti (toplam, başarılı, beklemede, iade)' })
  summary(
    @Param('tenantId') tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.paymentsService.getSummary(tenantId, { from, to });
  }

  @Get('tenant/:tenantId/export.csv')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN, Role.STORE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mağaza ödemelerini CSV indir' })
  async exportCsv(
    @Param('tenantId') tenantId: string,
    @Query('status') status: PaymentStatus | undefined,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Res() res: Response,
  ) {
    const rows = await this.paymentsService.findByTenant(tenantId, { status, from, to });
    const escape = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header = ['Tarih', 'Ödeme No', 'Müşteri', 'Hizmet', 'Tutar', 'Durum', 'Ödeme Tarihi'];
    const lines = rows.map((p: any) =>
      [
        new Date(p.createdAt).toLocaleString('tr-TR'),
        p.paytrOrderId || p.id,
        `${p.appointment?.customer?.firstName || ''} ${p.appointment?.customer?.lastName || ''}`.trim(),
        p.appointment?.service?.name || '',
        Number(p.amount).toFixed(2),
        p.status,
        p.paidAt ? new Date(p.paidAt).toLocaleString('tr-TR') : '',
      ]
        .map(escape)
        .join(','),
    );
    const csv = '﻿' + [header.map(escape).join(','), ...lines].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="odemeler-${Date.now()}.csv"`);
    res.send(csv);
  }

  @Post(':id/refund')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN, Role.STORE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ödemeyi iade olarak işaretle (manuel)' })
  refund(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: Role; tenantId?: string | null },
  ) {
    return this.paymentsService.markRefunded(id, user);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tüm ödemeleri listele (Superadmin)' })
  findAll(
    @Query('status') status?: PaymentStatus,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('q') q?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.paymentsService.findAll({ status, from, to, q, tenantId });
  }
}
