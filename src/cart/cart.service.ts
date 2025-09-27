import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  // Add product to cart
  async addToCart(userId: number, productId: number, quantity: number = 1) {
    try {
      const product = await this.prisma.product.findUnique({ where: { id: productId } });
      if (!product) {
        throw new HttpException({ message: 'Mahsulot topilmadi' }, HttpStatus.NOT_FOUND);
      }

      // user savatini topamiz yoki yaratamiz
      let cart = await this.prisma.cart.findUnique({ where: { userId } });
      if (!cart) {
        cart = await this.prisma.cart.create({ data: { userId } });
      }

      // mavjud itemni tekshiramiz
      const existingItem = await this.prisma.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId } },
      });

      if (existingItem) {
        const updated = await this.prisma.cartItem.update({
          where: { cartId_productId: { cartId: cart.id, productId } },
          data: { quantity: existingItem.quantity + quantity },
        });
        return { message: 'Savat yangilandi', data: updated };
      }

      const created = await this.prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity },
      });

      return { message: 'Savatga qo‘shildi', data: created };
    } catch (error) {
      throw new HttpException(
        { message: error.message || 'Savatga qo‘shishda xatolik', error: error.meta || error.code || null },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Get user cart
  async getCart(userId: number) {
    try {
      const cart = await this.prisma.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: { product: true },
          },
        },
      });
  
      if (!cart) {
        return { message: 'Savat bo‘sh', data: null };
      }
  
      // hisoblash
      const itemsWithTotal = cart.items.map((item) => ({
        ...item,
        totalPrice: item.product.price * item.quantity,
      }));
  
      const cartTotal = itemsWithTotal.reduce((sum, item) => sum + item.totalPrice, 0);
  
      return { message: 'Savat olindi', data: { ...cart, items: itemsWithTotal, cartTotal } };
    } catch (error) {
      throw new HttpException(
        { message: error.message || 'Savatni olishda xatolik', error: error.meta || error.code || null },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  

  // Update product quantity
  async updateQuantity(userId: number, productId: number, quantity: number) {
    try {
      if (quantity <= 0) {
        throw new HttpException({ message: 'Quantity 0 yoki manfiy bo‘lishi mumkin emas' }, HttpStatus.BAD_REQUEST);
      }

      const cart = await this.prisma.cart.findUnique({ where: { userId } });
      if (!cart) {
        throw new HttpException({ message: 'Savat topilmadi' }, HttpStatus.NOT_FOUND);
      }

      const existingItem = await this.prisma.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId } },
      });

      if (!existingItem) {
        throw new HttpException({ message: 'Savatda bunday mahsulot yo‘q' }, HttpStatus.NOT_FOUND);
      }

      const updated = await this.prisma.cartItem.update({
        where: { cartId_productId: { cartId: cart.id, productId } },
        data: { quantity },
      });

      return { message: 'Quantity yangilandi', data: updated };
    } catch (error) {
      throw new HttpException(
        { message: error.message || 'Quantity yangilashda xatolik', error: error.meta || error.code || null },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Remove product from cart
  async removeFromCart(userId: number, productId: number) {
    try {
      const cart = await this.prisma.cart.findUnique({ where: { userId } });
      if (!cart) {
        throw new HttpException({ message: 'Savat topilmadi' }, HttpStatus.NOT_FOUND);
      }

      const existingItem = await this.prisma.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId } },
      });

      if (!existingItem) {
        throw new HttpException({ message: 'Savatda bunday mahsulot yo‘q' }, HttpStatus.NOT_FOUND);
      }

      await this.prisma.cartItem.delete({
        where: { cartId_productId: { cartId: cart.id, productId } },
      });

      return { message: 'Savatdan o‘chirildi' };
    } catch (error) {
      throw new HttpException(
        { message: error.message || 'Savatdan o‘chirishda xatolik', error: error.meta || error.code || null },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
