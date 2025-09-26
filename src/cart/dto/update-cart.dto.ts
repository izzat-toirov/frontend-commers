import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateCartDto {
  @ApiProperty({ example: 1, description: 'Mahsulot ID' })
  @IsInt({ message: 'productId butun son bo‘lishi kerak' })
  productId: number;

  @ApiProperty({ example: 5, description: 'Yangilangan quantity' })
  @IsInt({ message: 'quantity butun son bo‘lishi kerak' })
  @Min(1, { message: 'quantity 1 dan kichik bo‘lishi mumkin emas' })
  quantity: number;
}
