import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const resendApiKey = this.configService.get('RESEND_API_KEY');
    
    if (resendApiKey) {
      // Use Resend SMTP integration if API key is provided
      this.logger.log('Resend.com API Key found. Configuring Nodemailer for Resend SMTP...');
      this.transporter = nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: {
          user: 'resend',
          pass: resendApiKey,
        },
      });
    } else {
      // Fallback to manual SMTP configuration or Ethereal
      this.transporter = nodemailer.createTransport({
        host: this.configService.get('SMTP_HOST') || 'smtp.ethereal.email',
        port: this.configService.get<number>('SMTP_PORT') || 587,
        secure: this.configService.get('SMTP_SECURE') === 'true',
        auth: {
          user: this.configService.get('SMTP_USER') || 'test',
          pass: this.configService.get('SMTP_PASS') || 'test',
        },
      });
    }
  }

  /**
   * Send appointment confirmation email to customer
   */
  async sendAppointmentConfirmation(data: {
    customerEmail: string;
    customerName: string;
    storeName: string;
    serviceName: string;
    employeeName: string;
    date: string;
    startTime: string;
    totalPrice: string;
  }) {
    const subject = `✅ Randevunuz Onaylandı — ${data.storeName}`;
    const html = this.appointmentConfirmationTemplate(data);
    await this.sendEmail(data.customerEmail, subject, html);
  }

  /**
   * Send appointment notification to store admin
   */
  async sendNewAppointmentToStore(data: {
    storeEmail: string;
    storeName: string;
    customerName: string;
    customerPhone?: string;
    serviceName: string;
    employeeName: string;
    date: string;
    startTime: string;
    totalPrice: string;
  }) {
    const subject = `Yeni Randevu — ${data.customerName}`;
    const html = this.storeNotificationTemplate(data);
    await this.sendEmail(data.storeEmail, subject, html);
  }

  /**
   * Notify the employee assigned to the appointment that a new booking is on
   * their calendar. Only fires if the Employee row is linked to a User with an
   * email address.
   */
  async sendAppointmentToEmployee(data: {
    employeeEmail: string;
    employeeName: string;
    storeName: string;
    customerName: string;
    customerPhone?: string;
    serviceName: string;
    date: string;
    startTime: string;
  }) {
    const subject = `Yeni Randevunuz — ${data.date} ${data.startTime}`;
    const html = this.employeeNotificationTemplate(data);
    await this.sendEmail(data.employeeEmail, subject, html);
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(data: {
    email: string;
    firstName: string;
  }) {
    const subject = `Hoş geldiniz, ${data.firstName}! 💜`;
    const html = this.welcomeTemplate(data);
    await this.sendEmail(data.email, subject, html);
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(data: {
    email: string;
    firstName: string;
    resetUrl: string;
  }) {
    const subject = `🔐 Şifre Sıfırlama — ZMK Beauty`;
    const html = this.passwordResetTemplate(data);
    await this.sendEmail(data.email, subject, html);
  }

  /**
   * Send 24-hour appointment reminder
   */
  async sendAppointmentReminder(data: {
    customerEmail: string;
    customerName: string;
    storeName: string;
    storePhone?: string;
    serviceName: string;
    employeeName: string;
    date: string;
    startTime: string;
  }) {
    const subject = `🔔 Yarınki Randevunuz — ${data.storeName}`;
    const html = this.reminderTemplate(data);
    await this.sendEmail(data.customerEmail, subject, html);
  }

  /**
   * Send appointment cancellation email
   */
  async sendAppointmentCancellation(data: {
    customerEmail: string;
    customerName: string;
    storeName: string;
    serviceName: string;
    date: string;
    startTime: string;
  }) {
    const subject = `❌ Randevunuz İptal Edildi — ${data.storeName}`;
    const html = this.cancellationTemplate(data);
    await this.sendEmail(data.customerEmail, subject, html);
  }

  // =============================================
  // CORE EMAIL SENDER
  // =============================================

  private async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    // If no API key, log and skip (dev mode)
    if (this.configService.get('NODE_ENV') !== 'production' && !this.configService.get('SMTP_HOST')) {
      this.logger.warn(`📧 [DEV MODE] Email skipped → ${to} | Subject: ${subject}`);
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get('EMAIL_FROM') || 'ZMK Beauty <noreply@zmkbeauty.com>',
        to,
        subject,
        html,
      });

      this.logger.log(`✅ Email sent to ${to} - MessageId: ${info.messageId}`);
      return true;
    } catch (err) {
      this.logger.error(`Email error to ${to}: ${err}`);
      return false;
    }
  }

  // =============================================
  // EMAIL TEMPLATES
  // =============================================

  private baseWrapper(content: string): string {
    return `
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f8f8f8;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <!-- Header -->
    <div style="text-align:center;padding:24px 0;">
      <div style="display:inline-block;padding:10px 20px;background:linear-gradient(135deg,#e11d48,#be185d);border-radius:12px;">
        <span style="color:#fff;font-size:20px;font-weight:bold;letter-spacing:0.5px;">ZMK Beauty</span>
      </div>
    </div>
    <!-- Content -->
    <div style="background:#fff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      ${content}
    </div>
    <!-- Footer -->
    <div style="text-align:center;padding:24px 0;color:#999;font-size:12px;">
      <p>ZMK Beauty Platform — Online Randevu Sistemi</p>
      <p><a href="https://zmkbeauty.com" style="color:#e11d48;text-decoration:none;">zmkbeauty.com</a></p>
    </div>
  </div>
</body>
</html>`;
  }

  private appointmentConfirmationTemplate(data: any): string {
    return this.baseWrapper(`
      <h2 style="margin:0 0 8px;color:#111;font-size:22px;">Randevunuz Onaylandı ✅</h2>
      <p style="color:#666;margin:0 0 24px;">Merhaba <strong>${data.customerName}</strong>, randevunuz başarıyla oluşturuldu.</p>

      <div style="background:#fef2f2;border-radius:12px;padding:20px;margin:0 0 24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#888;font-size:13px;">Mağaza</td>
            <td style="padding:8px 0;text-align:right;font-weight:600;color:#111;">${data.storeName}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#888;font-size:13px;border-top:1px solid #fecdd3;">Hizmet</td>
            <td style="padding:8px 0;text-align:right;font-weight:600;color:#111;border-top:1px solid #fecdd3;">${data.serviceName}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#888;font-size:13px;border-top:1px solid #fecdd3;">Uzman</td>
            <td style="padding:8px 0;text-align:right;font-weight:600;color:#111;border-top:1px solid #fecdd3;">${data.employeeName}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#888;font-size:13px;border-top:1px solid #fecdd3;">Tarih & Saat</td>
            <td style="padding:8px 0;text-align:right;font-weight:600;color:#111;border-top:1px solid #fecdd3;">${data.date} — ${data.startTime}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#888;font-size:13px;border-top:1px solid #fecdd3;">Tutar</td>
            <td style="padding:8px 0;text-align:right;font-weight:700;color:#e11d48;font-size:16px;border-top:1px solid #fecdd3;">${data.totalPrice}</td>
          </tr>
        </table>
      </div>

      <p style="color:#666;font-size:14px;margin:0;">
        Randevunuzu iptal etmek veya değiştirmek için lütfen mağaza ile iletişime geçin.
      </p>
    `);
  }

  private storeNotificationTemplate(data: any): string {
    return this.baseWrapper(`
      <h2 style="margin:0 0 8px;color:#111;font-size:22px;">Yeni Randevu 📋</h2>
      <p style="color:#666;margin:0 0 24px;"><strong>${data.storeName}</strong> için yeni bir randevu oluşturuldu.</p>

      <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin:0 0 24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#888;font-size:13px;">Müşteri</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#111;">${data.customerName}</td></tr>
          ${data.customerPhone ? `<tr><td style="padding:8px 0;color:#888;font-size:13px;border-top:1px solid #bbf7d0;">Telefon</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#111;border-top:1px solid #bbf7d0;">${data.customerPhone}</td></tr>` : ''}
          <tr><td style="padding:8px 0;color:#888;font-size:13px;border-top:1px solid #bbf7d0;">Hizmet</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#111;border-top:1px solid #bbf7d0;">${data.serviceName}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:13px;border-top:1px solid #bbf7d0;">Uzman</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#111;border-top:1px solid #bbf7d0;">${data.employeeName}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:13px;border-top:1px solid #bbf7d0;">Tarih & Saat</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#16a34a;border-top:1px solid #bbf7d0;">${data.date} — ${data.startTime}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:13px;border-top:1px solid #bbf7d0;">Tutar</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#e11d48;font-size:16px;border-top:1px solid #bbf7d0;">${data.totalPrice}</td></tr>
        </table>
      </div>
    `);
  }

  private welcomeTemplate(data: any): string {
    return this.baseWrapper(`
      <div style="text-align:center;">
        <div style="font-size:48px;margin:0 0 16px;">💜</div>
        <h2 style="margin:0 0 8px;color:#111;font-size:24px;">Hoş Geldiniz!</h2>
        <p style="color:#666;margin:0 0 24px;">
          Merhaba <strong>${data.firstName}</strong>, ZMK Beauty ailesine katıldığınız için teşekkür ederiz.
        </p>
        <p style="color:#666;margin:0 0 24px;font-size:14px;">
          Artık Kırıkkale'deki en iyi güzellik merkezlerinden online randevu alabilir, 
          güvenli ödeme yapabilir ve size özel tekliflerden faydalanabilirsiniz.
        </p>
        <a href="https://zmkbeauty.com" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#e11d48,#be185d);color:#fff;text-decoration:none;border-radius:12px;font-weight:bold;font-size:15px;">
          Hemen Keşfet →
        </a>
      </div>
    `);
  }

  private passwordResetTemplate(data: any): string {
    return this.baseWrapper(`
      <h2 style="margin:0 0 8px;color:#111;font-size:22px;">Şifre Sıfırlama Talebi 🔐</h2>
      <p style="color:#666;margin:0 0 24px;">
        Merhaba <strong>${data.firstName}</strong>, hesabınız için bir şifre sıfırlama talebi oluşturuldu.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${data.resetUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#e11d48,#be185d);color:#fff;text-decoration:none;border-radius:12px;font-weight:bold;font-size:15px;">
          Şifremi Sıfırla
        </a>
      </div>
      <p style="color:#888;font-size:13px;margin:16px 0 0;">
        Bu bağlantı <strong>60 dakika</strong> içinde geçerliliğini yitirecektir.
      </p>
      <p style="color:#888;font-size:13px;margin:12px 0 0;">
        Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz; hesabınız güvendedir.
      </p>
      <p style="color:#999;font-size:12px;margin:16px 0 0;word-break:break-all;">
        Bağlantı açılmıyorsa: <a href="${data.resetUrl}" style="color:#e11d48;">${data.resetUrl}</a>
      </p>
    `);
  }

  private employeeNotificationTemplate(data: any): string {
    return this.baseWrapper(`
      <h2 style="margin:0 0 8px;color:#111;font-size:22px;">Yeni Randevunuz 🗓️</h2>
      <p style="color:#666;margin:0 0 24px;">Merhaba <strong>${data.employeeName}</strong>, programınıza yeni bir randevu eklendi.</p>

      <div style="background:#eff6ff;border-radius:12px;padding:20px;margin:0 0 24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#888;font-size:13px;">Mağaza</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#111;">${data.storeName}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:13px;border-top:1px solid #bfdbfe;">Müşteri</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#111;border-top:1px solid #bfdbfe;">${data.customerName}</td></tr>
          ${data.customerPhone ? `<tr><td style="padding:8px 0;color:#888;font-size:13px;border-top:1px solid #bfdbfe;">Telefon</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#111;border-top:1px solid #bfdbfe;">${data.customerPhone}</td></tr>` : ''}
          <tr><td style="padding:8px 0;color:#888;font-size:13px;border-top:1px solid #bfdbfe;">Hizmet</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#111;border-top:1px solid #bfdbfe;">${data.serviceName}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:13px;border-top:1px solid #bfdbfe;">Tarih & Saat</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#2563eb;border-top:1px solid #bfdbfe;">${data.date} — ${data.startTime}</td></tr>
        </table>
      </div>

      <p style="color:#666;font-size:14px;margin:0;">Randevunuzu mağaza panelinden detaylı görüntüleyebilirsiniz.</p>
    `);
  }

  private reminderTemplate(data: any): string {
    return this.baseWrapper(`
      <h2 style="margin:0 0 8px;color:#111;font-size:22px;">Yarın Randevunuz Var 🔔</h2>
      <p style="color:#666;margin:0 0 24px;">Merhaba <strong>${data.customerName}</strong>, yarınki randevunuzu hatırlatmak istedik.</p>

      <div style="background:#fef3c7;border-radius:12px;padding:20px;margin:0 0 24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#888;font-size:13px;">Mağaza</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#111;">${data.storeName}</td></tr>
          ${data.storePhone ? `<tr><td style="padding:8px 0;color:#888;font-size:13px;border-top:1px solid #fde68a;">Telefon</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#111;border-top:1px solid #fde68a;">${data.storePhone}</td></tr>` : ''}
          <tr><td style="padding:8px 0;color:#888;font-size:13px;border-top:1px solid #fde68a;">Hizmet</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#111;border-top:1px solid #fde68a;">${data.serviceName}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:13px;border-top:1px solid #fde68a;">Uzman</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#111;border-top:1px solid #fde68a;">${data.employeeName}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:13px;border-top:1px solid #fde68a;">Tarih & Saat</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#b45309;border-top:1px solid #fde68a;">${data.date} — ${data.startTime}</td></tr>
        </table>
      </div>

      <p style="color:#666;font-size:14px;margin:0 0 8px;">
        Gelmenizi engelleyen bir durum varsa lütfen mağaza ile iletişime geçin veya hesabınızdan iptal/erteleme yapın.
      </p>
      <p style="color:#888;font-size:13px;margin:8px 0 0;">Sizi görmeyi sabırsızlıkla bekliyoruz! 💜</p>
    `);
  }

  private cancellationTemplate(data: any): string {
    return this.baseWrapper(`
      <h2 style="margin:0 0 8px;color:#111;font-size:22px;">Randevu İptal Edildi ❌</h2>
      <p style="color:#666;margin:0 0 24px;">Merhaba <strong>${data.customerName}</strong>, aşağıdaki randevunuz iptal edilmiştir.</p>

      <div style="background:#fef2f2;border-radius:12px;padding:20px;margin:0 0 24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#888;font-size:13px;">Mağaza</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#111;">${data.storeName}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:13px;border-top:1px solid #fecdd3;">Hizmet</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#111;border-top:1px solid #fecdd3;">${data.serviceName}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:13px;border-top:1px solid #fecdd3;">Tarih & Saat</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#dc2626;border-top:1px solid #fecdd3;text-decoration:line-through;">${data.date} — ${data.startTime}</td></tr>
        </table>
      </div>

      <p style="color:#666;font-size:14px;">Yeni bir randevu oluşturmak için platformumuzu ziyaret edebilirsiniz.</p>
    `);
  }
}
