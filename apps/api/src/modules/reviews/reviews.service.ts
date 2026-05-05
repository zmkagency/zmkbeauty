import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(customerId: string, data: { appointmentId: string; rating: number; comment?: string }) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: data.appointmentId }
    });

    if (!appointment) throw new NotFoundException('Randevu bulunamadı');
    if (appointment.customerId !== customerId) throw new BadRequestException('Bu randevuyu değerlendiremezsiniz');
    if (appointment.status !== 'COMPLETED') throw new BadRequestException('Sadece tamamlanmış randevuları değerlendirebilirsiniz');

    const existingReview = await this.prisma.review.findUnique({
      where: { appointmentId: data.appointmentId }
    });
    if (existingReview) throw new BadRequestException('Bu randevu için zaten bir değerlendirme yaptınız');

    return this.prisma.review.create({
      data: {
        tenantId: appointment.tenantId,
        customerId,
        appointmentId: data.appointmentId,
        rating: data.rating,
        comment: data.comment,
        isApproved: true, // Auto-approve by default, can be changed
      }
    });
  }

  async getTenantReviews(tenantId: string) {
    return this.prisma.review.findMany({
      where: { tenantId, isApproved: true },
      include: {
        customer: { select: { firstName: true, lastName: true, avatarUrl: true } },
        appointment: { select: { service: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async replyToReview(tenantId: string, reviewId: string, reply: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Yorum bulunamadı');
    if (review.tenantId !== tenantId) throw new BadRequestException('Bu yoruma cevap verme yetkiniz yok');

    return this.prisma.review.update({
      where: { id: reviewId },
      data: { tenantReply: reply }
    });
  }
}