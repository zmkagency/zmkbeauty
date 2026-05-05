import { IsString, IsOptional, IsDateString, Matches, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for store admin to create a manual / walk-in appointment.
 * The customer either matches an existing user (by email or phone) or
 * a lightweight customer record is created on the fly.
 */
export class WalkinAppointmentDto {
  @ApiProperty()
  @IsString()
  tenantId: string;

  @ApiProperty()
  @IsString()
  employeeId: string;

  @ApiProperty()
  @IsString()
  serviceId: string;

  @ApiProperty({ example: '2026-05-04', description: 'YYYY-MM-DD' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: '15:30', description: 'HH:mm' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Geçerli bir saat giriniz (HH:mm)' })
  startTime: string;

  @ApiProperty()
  @IsString()
  customerFirstName: string;

  @ApiProperty()
  @IsString()
  customerLastName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Ödeme tahsil edildi mi (kasa/peşin)' })
  @IsOptional()
  paid?: boolean;
}
