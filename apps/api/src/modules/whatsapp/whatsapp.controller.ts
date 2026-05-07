import { Controller, Post, Body, HttpCode, HttpStatus, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  /**
   * Webhook verification endpoint for Meta
   */
  @Get('webhook')
  @ApiOperation({ summary: 'Verify Webhook for Meta API' })
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    // In production, compare token with env.WHATSAPP_VERIFY_TOKEN
    if (mode === 'subscribe' && token) {
      return challenge;
    }
    return null;
  }

  /**
   * Receive messages from WhatsApp
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive messages from WhatsApp Webhook' })
  async handleWebhook(@Body() body: any) {
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.value && change.value.messages) {
            const message = change.value.messages[0];
            const from = message.from;
            let text = '';

            if (message.type === 'text') {
              text = message.text.body;
            } else if (message.type === 'button') {
              text = message.button.text;
            }

            await this.whatsappService.handleIncomingMessage({ from, text });
          }
        }
      }
    }
    // Always return 200 OK to Meta
    return 'EVENT_RECEIVED';
  }
}
