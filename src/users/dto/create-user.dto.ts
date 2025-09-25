import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsBoolean,
} from 'class-validator';
import { Role } from '../../../generated/prisma'; // Prisma-dan Role enum keladi

export class CreateUserDto {
  @ApiProperty({ example: 'Ali', description: 'Foydalanuvchi ismi' })
  @IsString()
  @IsNotEmpty()
  fname: string;

  @ApiPropertyOptional({ example: 'Valiyev', description: 'Familiyasi (ixtiyoriy)' })
  @IsString()
  @IsOptional()
  lname?: string;

  @ApiPropertyOptional({ example: 'Toshkent, Chilonzor', description: 'Manzil (ixtiyoriy)' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 'ali@gmail.com', description: 'Email manzil' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'parol', description: 'Parol (kamida 6 ta belgidan iborat)' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: Role, example: Role.USER, description: 'Foydalanuvchi roli' })
  @IsEnum(Role)
  role: Role;

  // Agar kerak bo‘lsa:
  // @ApiPropertyOptional({ example: true, description: 'Foydalanuvchi aktivmi yoki yo‘q (default: false)' })
  // @IsBoolean()
  // @IsOptional()
  // isActive?: boolean = false;
}
