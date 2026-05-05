import { Module, Global } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { RemindersService } from './reminders.service';
import { SmsService } from './sms.service';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';

@Global()
@Module({
  providers: [NotificationsService, RemindersService, SmsService, EventsService],
  controllers: [EventsController],
  exports: [NotificationsService, SmsService, EventsService],
})
export class NotificationsModule {}
