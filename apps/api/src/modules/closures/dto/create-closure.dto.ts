import { IsDateString, IsOptional, IsString, IsBoolean, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClosureDto {
  @ApiProperty({ example: '2026-05-19', description: 'YYYY-MM-DD' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 'Resmi tatil' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ example: true, description: 'Tüm gün mü kapalı?' })
  @IsOptional()
  @IsBoolean()
  isFullDay?: boolean;

  @ApiPropertyOptional({ example: '14:00', description: 'Kısmi kapanış başlangıç (HH:mm)' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Geçerli bir saat giriniz (HH:mm)' })
  startTime?: string;

  @ApiPropertyOptional({ example: '18:00', description: 'Kısmi kapanış bitiş (HH:mm)' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Geçerli bir saat giriniz (HH:mm)' })
  endTime?: string;
}
