import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { SlotEngineService } from './slot-engine.service';
import { CampaignsModule } from '../campaigns/campaigns.module';

@Module({
  imports: [CampaignsModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, SlotEngineService],
  exports: [AppointmentsService, SlotEngineService],
})
export class AppointmentsModule {}
