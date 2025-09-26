import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsPositive,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 'iPhone 15', description: 'Mahsulot nomi' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'Yangi iPhone 15 256GB, original',
    description: 'Mahsulot haqida batafsil',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 1200.5, description: 'Mahsulot narxi ($)' })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({ example: 10, description: 'Ombordagi soni' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiProperty({ example: 'Apple', description: 'Brend nomi', required: false })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    required: false,
    description: 'Mahsulot rasmlari (file upload)',
  })
  @IsOptional()
  images?: any[];

  @ApiProperty({ example: 1, description: 'Kategoriya ID' })
  @Type(() => Number)
  @IsNumber()
  categoryId: number;

  // <-- userId qo‘shildi
  @ApiProperty({ example: 2, description: 'Mahsulotni qo‘shgan user ID' })
  @Type(() => Number)
  @IsNumber()
  userId: number;
}
