import { Controller, Post, Body, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ReviewsService } from './reviews.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles('CUSTOMER')
  @ApiOperation({ summary: 'Müşteri randevuyu değerlendirir' })
  create(
    @CurrentUser('id') customerId: string, 
    @Body() data: { appointmentId: string; rating: number; comment?: string }
  ) {
    return this.reviewsService.create(customerId, data);
  }

  @Get('tenant/:tenantId')
  @ApiOperation({ summary: 'Bir mağazanın tüm onaylı yorumlarını getir (Public)' })
  getTenantReviews(@Param('tenantId') tenantId: string) {
    return this.reviewsService.getTenantReviews(tenantId);
  }

  @Patch(':id/reply')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles('STORE_ADMIN')
  @ApiOperation({ summary: 'Mağaza sahibi yoruma cevap yazar' })
  replyToReview(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') reviewId: string,
    @Body('reply') reply: string
  ) {
    return this.reviewsService.replyToReview(tenantId, reviewId, reply);
  }
}