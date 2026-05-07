import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CustomerRegisterDto {
  @ApiProperty({ example: 'musteri@example.com' })
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz' })
  email: string;

  @ApiProperty({ example: 'Güçlü Şifre 123' })
  @IsString()
  @MinLength(6, { message: 'Şifre en az 6 karakter olmalıdır' })
  password: string;

  @ApiProperty({ example: 'Ayşe' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Kaya' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ example: '05321234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Tercih edilen salon tenant ID' })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({ example: 'mobile' })
  @IsOptional()
  @IsIn(['web', 'mobile', 'admin', 'import'])
  source?: 'web' | 'mobile' | 'admin' | 'import';

  @ApiPropertyOptional({ description: 'Expo push token (mobil için)' })
  @IsOptional()
  @IsString()
  deviceToken?: string;
}
