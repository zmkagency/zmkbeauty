import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * SMS gateway abstraction.
 *
 * Provider matrix (env-driven via SMS_PROVIDER):
 *   - "netgsm"        → NetGSM HTTP API (default for TR)
 *   - "iletimerkezi"  → İleti Merkezi REST API (TR)
 *   - "twilio"        → Twilio REST (international fallback)
 *   - unset / "log"   → no-op, logs to console (dev/test)
 *
 * The service exposes a single `send(phone, message)` method. All providers
 * normalize phone numbers to TR-friendly E.164-ish format ("+90...") and
 * silently downgrade to logging when credentials are missing — production
 * never throws on missing config so an outage in the SMS layer can never
 * cascade into appointment creation failures.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly provider: string;
  private readonly cfg: Record<string, string | undefined>;

  constructor(private configService: ConfigService) {
    this.provider = (this.configService.get<string>('SMS_PROVIDER') || 'log').toLowerCase();
    this.cfg = {
      netgsmUser: this.configService.get('NETGSM_USERCODE'),
      netgsmPass: this.configService.get('NETGSM_PASSWORD'),
      netgsmHeader: this.configService.get('NETGSM_MSG_HEADER'),
      ileticUser: this.configService.get('ILETI_MERKEZI_USERNAME'),
      ileticPass: this.configService.get('ILETI_MERKEZI_PASSWORD'),
      ileticSender: this.configService.get('ILETI_MERKEZI_SENDER'),
      twilioSid: this.configService.get('TWILIO_ACCOUNT_SID'),
      twilioToken: this.configService.get('TWILIO_AUTH_TOKEN'),
      twilioFrom: this.configService.get('TWILIO_FROM'),
    };
  }

  /**
   * Normalize a Turkish phone number into "90XXXXXXXXXX" form (NetGSM/Ileti
   * format) and "+90XXXXXXXXXX" for Twilio. Strips all non-digits and any
   * leading 0/90 country prefix, then prepends 90.
   */
  private normalizeTr(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('90')) return digits;
    if (digits.startsWith('0')) return '90' + digits.slice(1);
    if (digits.length === 10) return '90' + digits;
    return digits;
  }

  /**
   * Send a single SMS. Returns true on success, false on configuration miss
   * or provider error. Never throws.
   */
  async send(phone: string, message: string): Promise<boolean> {
    if (!phone) return false;
    const normalized = this.normalizeTr(phone);
    if (!normalized) return false;

    if (this.provider === 'log') {
      this.logger.log(`📱 [SMS-LOG] → +${normalized}: ${message}`);
      return false;
    }

    try {
      switch (this.provider) {
        case 'netgsm':
          return await this.sendNetgsm(normalized, message);
        case 'iletimerkezi':
          return await this.sendIletiMerkezi(normalized, message);
        case 'twilio':
          return await this.sendTwilio(normalized, message);
        default:
          this.logger.warn(`Unknown SMS_PROVIDER=${this.provider}`);
          return false;
      }
    } catch (err) {
      this.logger.error(`SMS send failed (${this.provider}) → +${normalized}: ${err}`);
      return false;
    }
  }

  // ---------- NetGSM ----------
  private async sendNetgsm(phone: string, message: string): Promise<boolean> {
    if (!this.cfg.netgsmUser || !this.cfg.netgsmPass || !this.cfg.netgsmHeader) {
      this.logger.warn('NetGSM credentials missing; skipping SMS.');
      return false;
    }
    // NetGSM XML POST gateway — single SMS to one phone
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<mainbody>
  <header>
    <usercode>${this.cfg.netgsmUser}</usercode>
    <password>${this.cfg.netgsmPass}</password>
    <type>1:n</type>
    <msgheader>${this.cfg.netgsmHeader}</msgheader>
  </header>
  <body>
    <msg><![CDATA[${message}]]></msg>
    <no>${phone}</no>
  </body>
</mainbody>`;
    const res = await axios.post('https://api.netgsm.com.tr/sms/send/xml', xml, {
      headers: { 'Content-Type': 'application/xml' },
      timeout: 10000,
    });
    const body = String(res.data || '').trim();
    // NetGSM returns "00 <jobid>" on success, otherwise an error code.
    const ok = body.startsWith('00');
    if (!ok) this.logger.warn(`NetGSM response: ${body}`);
    return ok;
  }

  // ---------- İleti Merkezi ----------
  private async sendIletiMerkezi(phone: string, message: string): Promise<boolean> {
    if (!this.cfg.ileticUser || !this.cfg.ileticPass || !this.cfg.ileticSender) {
      this.logger.warn('İleti Merkezi credentials missing; skipping SMS.');
      return false;
    }
    const payload = {
      request: {
        authentication: { username: this.cfg.ileticUser, password: this.cfg.ileticPass },
        order: {
          sender: this.cfg.ileticSender,
          sendDateTime: [],
          iys: '1',
          iysList: 'BIREYSEL',
          message: { text: message, receipents: { number: [phone] } },
        },
      },
    };
    const res = await axios.post(
      'https://api.iletimerkezi.com/v1/send-sms/json',
      payload,
      { timeout: 10000 },
    );
    const code = res.data?.response?.status?.code;
    return code === '200';
  }

  // ---------- Twilio ----------
  private async sendTwilio(phone: string, message: string): Promise<boolean> {
    if (!this.cfg.twilioSid || !this.cfg.twilioToken || !this.cfg.twilioFrom) {
      this.logger.warn('Twilio credentials missing; skipping SMS.');
      return false;
    }
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.cfg.twilioSid}/Messages.json`;
    const params = new URLSearchParams({
      To: '+' + phone,
      From: this.cfg.twilioFrom,
      Body: message,
    });
    const res = await axios.post(url, params.toString(), {
      auth: { username: this.cfg.twilioSid, password: this.cfg.twilioToken },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000,
    });
    return !!res.data?.sid;
  }
}
