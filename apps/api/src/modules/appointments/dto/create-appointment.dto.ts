import { IsString, IsOptional, IsDateString, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty()
  @IsString()
  tenantId: string;

  @ApiProperty()
  @IsString()
  employeeId: string;

  @ApiProperty()
  @IsString()
  serviceId: string;

  @ApiProperty({ example: '2026-05-01', description: 'YYYY-MM-DD' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: '14:30', description: 'HH:mm' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Geçerli bir saat giriniz (HH:mm)' })
  startTime: string;

  @ApiPropertyOptional({ description: 'Müşteri notu / istek' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Uygulanacak kupon kodu' })
  @IsOptional()
  @IsString()
  couponCode?: string;
}
