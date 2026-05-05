import { IsString, IsDateString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RescheduleAppointmentDto {
  @ApiProperty({ example: '2026-05-04', description: 'YYYY-MM-DD' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: '15:30', description: 'HH:mm' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Geçerli bir saat giriniz (HH:mm)' })
  startTime: string;

  @ApiProperty({ required: false, description: 'İsteğe bağlı yeni çalışan' })
  @IsString()
  employeeId?: string;
}
