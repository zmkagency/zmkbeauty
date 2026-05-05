import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'Ayşe' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Demir' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ example: 'Kuaför Uzmanı' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ example: ['service-id-1', 'service-id-2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceIds?: string[];
}
