import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';

import { UpdateCartDto } from './dto/update-cart.dto';
import { AddToCartDto } from './dto/create-cart.dto';
import { RemoveCartDto } from './dto/remove-cart.dto';
import { JwtGuard } from '../common/guards/jwt.guard';

@ApiTags('Cart')
@ApiBearerAuth()
@Controller('cart')
@UseGuards(JwtGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('add')
  @ApiOperation({ summary: 'Savatga mahsulot qo‘shish' })
  @ApiResponse({ status: 201, description: 'Mahsulot savatga qo‘shildi' })
  @ApiResponse({ status: 404, description: 'Mahsulot topilmadi' })
  async addToCart(@Req() req, @Body() dto: AddToCartDto) {
    const userId = req.user.id; // JWT payload dan userId olinadi
    return this.cartService.addToCart(userId, dto.productId, dto.quantity ?? 1);
  }

  @Get()
  @ApiOperation({ summary: 'Foydalanuvchining savatini olish' })
  @ApiResponse({ status: 200, description: 'Savat muvaffaqiyatli olindi' })
  async getCart(@Req() req) {
    const userId = req.user.id;
    return this.cartService.getCart(userId);
  }

  @Put('update')
  @ApiOperation({ summary: 'Savatdagi mahsulot quantity ni yangilash' })
  @ApiResponse({ status: 200, description: 'Quantity yangilandi' })
  @ApiResponse({ status: 404, description: 'Savatda bunday mahsulot yo‘q' })
  async updateQuantity(@Req() req, @Body() dto: UpdateCartDto) {
    const userId = req.user.id;
    return this.cartService.updateQuantity(userId, dto.productId, dto.quantity);
  }

  @Delete('remove')
  @ApiOperation({ summary: 'Savatdan mahsulotni o‘chirish' })
  @ApiResponse({ status: 200, description: 'Mahsulot o‘chirildi' })
  @ApiResponse({ status: 404, description: 'Savatda bunday mahsulot yo‘q' })
  async removeFromCart(@Req() req, @Body() dto: RemoveCartDto) {
    const userId = req.user.id;
    return this.cartService.removeFromCart(userId, dto.productId);
  }
}
