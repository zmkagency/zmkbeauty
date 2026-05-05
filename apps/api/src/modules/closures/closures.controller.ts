import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ClosuresService } from './closures.service';
import { CreateClosureDto } from './dto/create-closure.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('Store Closures')
@Controller('tenants/:tenantId/closures')
export class ClosuresController {
  constructor(private readonly closuresService: ClosuresService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN, Role.STORE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kapalı gün ekle' })
  create(@Param('tenantId') tenantId: string, @Body() dto: CreateClosureDto) {
    return this.closuresService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Kapalı günleri listele' })
  findByTenant(@Param('tenantId') tenantId: string) {
    return this.closuresService.findByTenant(tenantId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPERADMIN, Role.STORE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kapalı gün sil' })
  delete(@Param('id') id: string) {
    return this.closuresService.delete(id);
  }
}
