import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WaitlistService } from '../waitlist/waitlist.service';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private prisma: PrismaService,
    private waitlistService: WaitlistService,
  ) {}

  /**
   * Send a template message via Meta WhatsApp Business API
   */
  async sendAppointmentReminder(appointmentId: string, phone: string, date: string, time: string, storeName: string) {
    this.logger.log(`[WhatsApp] Sending reminder to ${phone} for appointment ${appointmentId}`);
    
    // Implementation for Meta API HTTP request goes here
    // Example:
    // await axios.post('https://graph.facebook.com/v17.0/PHONE_NUMBER_ID/messages', {
    //   messaging_product: "whatsapp",
    //   to: phone,
    //   type: "template",
    //   template: { ... }
    // });

    // Save message ID to track replies
    const mockMessageId = `wa_msg_${Date.now()}`;
    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { whatsappMessageId: mockMessageId },
    });

    return true;
  }

  /**
   * Handle incoming Webhook from Meta
   */
  async handleIncomingMessage(payload: any) {
    this.logger.log(`[WhatsApp] Received webhook payload: ${JSON.stringify(payload)}`);

    // In a real scenario, parse payload.entry[0].changes[0].value.messages[0]
    // For this implementation plan, we assume we parsed `fromPhone` and `textMessage`
    const fromPhone = payload.from; // Example: "905321234567"
    const textMessage = payload.text; // "1" or "2"

    if (!fromPhone || !textMessage) return;

    // Find the most recent pending appointment for this phone number
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        customer: { phone: fromPhone },
        status: { in: ['PENDING_PAYMENT', 'CONFIRMED'] }, // Actually "PENDING" in waitlist context
        date: { gte: new Date() } // Future appointments only
      },
      orderBy: { date: 'asc' },
      include: { tenant: true }
    });

    if (!appointment) {
      this.logger.log(`[WhatsApp] No pending appointment found for phone ${fromPhone}`);
      return;
    }

    if (textMessage.trim() === '1') {
      // Confirm appointment
      await this.prisma.appointment.update({
        where: { id: appointment.id },
        data: { status: 'CONFIRMED' },
      });
      this.logger.log(`[WhatsApp] Appointment ${appointment.id} CONFIRMED via WhatsApp.`);
      
      // Optionally send a "Thank you" reply
      // await this.sendMessage(fromPhone, "Randevunuz başarıyla onaylanmıştır. Teşekkür ederiz.");
    } 
    else if (textMessage.trim() === '2') {
      // Cancel appointment
      await this.prisma.appointment.update({
        where: { id: appointment.id },
        data: { status: 'CANCELLED' },
      });
      this.logger.log(`[WhatsApp] Appointment ${appointment.id} CANCELLED via WhatsApp.`);
      
      // Notify Waitlist
      const dateStr = appointment.date.toISOString().split('T')[0];
      await this.waitlistService.notifyWaitlist(appointment.tenantId, dateStr, appointment.serviceId);
      this.logger.log(`[WhatsApp] Waitlist notified for slot ${dateStr}`);
      
      // Optionally send cancellation confirmation
      // await this.sendMessage(fromPhone, "Randevunuz iptal edilmiştir. Teşekkür ederiz.");
    }
  }
}
