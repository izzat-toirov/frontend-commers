import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class AddToCartDto {
  @ApiProperty({ example: 1, description: 'Mahsulot ID' })
  @IsInt({ message: 'productId butun son bo‘lishi kerak' })
  productId: number;

  @ApiProperty({ example: 2, description: 'Mahsulot soni', required: false })
  @IsOptional()
  @IsInt({ message: 'quantity butun son bo‘lishi kerak' })
  @Min(1, { message: 'quantity 1 dan kichik bo‘lishi mumkin emas' })
  quantity?: number = 1;
}
