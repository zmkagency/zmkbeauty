import { Controller, Get, Patch, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { MobileService } from './mobile.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Mobile')
@Controller('mobile')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class MobileController {
  constructor(private mobileService: MobileService) {}

  @Get('home')
  @ApiOperation({ summary: 'Ana ekran verileri (kullanıcı, yaklaşan randevular, son salonlar, öne çıkanlar)' })
  getHome(@CurrentUser('id') userId: string) {
    return this.mobileService.getHome(userId);
  }

  @Get('appointments')
  @ApiOperation({ summary: 'Kullanıcının randevuları' })
  getAppointments(
    @CurrentUser('id') userId: string,
    @Query('filter') filter?: 'upcoming' | 'past' | 'all',
  ) {
    return this.mobileService.getMyAppointments(userId, filter);
  }

  @Get('loyalty')
  @ApiOperation({ summary: 'Tüm salonlardaki sadakat hesapları' })
  getLoyalty(@CurrentUser('id') userId: string) {
    return this.mobileService.getMyLoyalty(userId);
  }

  @Get('packages')
  @ApiOperation({ summary: 'Kullanıcının aktif paketleri' })
  getPackages(@CurrentUser('id') userId: string) {
    return this.mobileService.getMyPackages(userId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Salon arama' })
  searchSalons(
    @Query('q') query?: string,
    @Query('city') city?: string,
  ) {
    return this.mobileService.searchSalons(query, city);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Profil güncelleme' })
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() body: { firstName?: string; lastName?: string; phone?: string; avatarUrl?: string; birthDate?: string },
  ) {
    return this.mobileService.updateProfile(userId, body);
  }

  @Post('device-token')
  @ApiOperation({ summary: 'Push notification cihaz token kaydet' })
  registerDevice(
    @CurrentUser('id') userId: string,
    @Body() body: { token: string },
  ) {
    return this.mobileService.registerDevice(userId, body.token);
  }
}
