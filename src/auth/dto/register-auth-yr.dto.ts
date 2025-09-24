import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, IsUUID, MinLength } from 'class-validator';
import { UUID } from 'crypto';
import { Role } from '../../../generated/prisma';

export class RegisterAuthYr {
  @ApiProperty({ example: 'Ali', description: 'Foydalanuvchi ismi' })
  @IsString()
  @IsNotEmpty()
  fname: string;

  @ApiPropertyOptional({
    example: 'Valiyev',
    description: 'Familiyasi (ixtiyoriy)',
  })
  @IsString()
  @IsOptional()
  lname?: string;

  @ApiPropertyOptional({
    example: 'Toshkent, Chilonzor',
    description: 'Manzil (ixtiyoriy)',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 'ali@gmail.com', description: 'Email manzil' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'StrongPass123!',
    description: 'Parol (kamida 6 ta belgidan iborat)',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    enum: Role,
    example: Role.USER,
    description: 'Foydalanuvchi roli',
  })
  @IsEnum(Role)
  role: Role;
}
