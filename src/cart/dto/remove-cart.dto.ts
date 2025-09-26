import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class RemoveCartDto {
  @ApiProperty({ example: 1, description: 'Mahsulot ID' })
  @IsInt({ message: 'productId butun son bo‘lishi kerak' })
  productId: number;
}
