import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CrmService } from './crm.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  providers: [CrmService],
  exports: [CrmService],
})
export class CrmModule {}
