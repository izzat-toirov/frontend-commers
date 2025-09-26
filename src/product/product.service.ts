import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Role } from '../../generated/prisma';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async createDefaultProducts() {
    try {
      // 1️⃣ Admin yoki Owner userni topamiz
      const ownerOrAdmin = await this.prisma.user.findFirst({
        where: { OR: [{ role: Role.ADMIN }, { role: Role.OWNER }] },
      });
  
      if (!ownerOrAdmin) {
        console.log('❗ Default productlarni yaratish uchun admin/super admin mavjud emas');
        return;
      }
  
      // 2️⃣ Kamida 1 ta category borligini tekshiramiz
      const category = await this.prisma.category.findFirst();
      if (!category) {
        console.log('❗ Avval default kategoriyalarni yarating');
        return;
      }
  
      // 3️⃣ Bazada mavjud productlar sonini tekshiramiz
      const existingProducts = await this.prisma.product.findMany();
      if (existingProducts.length >= 20) {
        console.log('❗ Default 20 ta product allaqachon mavjud');
        return;
      }
  
      // 4️⃣ Yaratiladigan productlar sonini aniqlaymiz
      const productsToCreate = 20 - existingProducts.length;
  
      for (let i = 1; i <= productsToCreate; i++) {
        const title = `Mahsulot ${i}`;
  
        const existing = await this.prisma.product.findFirst({
          where: { title },
        });
  
        if (!existing) {
          await this.prisma.product.create({
            data: {
              title,
              description: `Bu ${title} uchun default description`,
              price: Math.floor(Math.random() * 1000) + 100, // 100–1100 araligi
              stock: Math.floor(Math.random() * 50) + 10, // 10–60 araligi
              brand: `Brand ${i}`,
              images: [`https://picsum.photos/seed/product${i}/400/400`],
              categoryId: category.id,
              userId: ownerOrAdmin.id,
            },
          });
          console.log(`✅ ${title} yaratildi`);
        }
      }
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Default productlarni yaratishda xatolik yuz berdi',
      );
    }
  }
  



  // yordamchi: product borligini tekshiradi yoki NotFoundException tashlaydi
  private async ensureProductExists(id: number) {
    try {
      const product = await this.prisma.product.findUnique({ where: { id } });
      if (!product) throw new NotFoundException('Product topilmadi');
      return product;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  // yordamchi: user rolini tekshiradi, OWNER yoki ADMIN
  private checkOwnerOrAdmin(productUserId: number, currentUser: any) {
    try {
      if (currentUser.role === Role.ADMIN) return true;
      if (productUserId === currentUser.id) return true;
      throw new ForbiddenException('Siz bu productni o‘zgartira olmaysiz');
    } catch (error) {
      throw error;
    }
  }

  // ✅ Create Product (JWT user orqali)
  async create(dto: CreateProductDto, user: any, images: string[] = []) {
    try {
      const { userId, categoryId } = dto;
  
      const trainig = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!trainig) {
        throw new NotFoundException(`User topilmadi: userId = ${userId}`);
      }
    
      const player = await this.prisma.category.findUnique({ where: { id: categoryId } });
      if (!player) {
        throw new NotFoundException(`Category topilmadi: categoryId = ${categoryId}`);
      }
      const product = await this.prisma.product.create({
        data: {
          ...dto,
          images,
          userId,
          categoryId
        },
      });
      return { message: 'Product created', data: product };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  // ✅ Get all products (public)
  async findAll(query: {
    page?: number;
    pageSize?: number;
    categoryId?: number;
    userId?: number;
    brand?: string;
    search?: string;
    sortBy?: 'price' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  }) {
    try {
      const {
        page = 1,
        pageSize = 20,
        categoryId,
        userId,
        brand,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = query;
  
      const skip = (page - 1) * pageSize;
  
      // where shartlarini dinamik yig‘ish
      const where: any = {};
  
      if (categoryId) where.categoryId = categoryId;
      if (userId) where.userId = userId;
      if (brand) where.brand = { contains: brand, mode: 'insensitive' };
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }
  
      const [data, total] = await this.prisma.$transaction([
        this.prisma.product.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { [sortBy]: sortOrder },
          include: {
            category: { select: { id: true, name: true } },
            user: { select: { id: true, fname: true, lname: true, email: true } },
          },
        }),
        this.prisma.product.count({ where }),
      ]);
  
      return {
        message: 'Mahsulotlar ro‘yxati muvaffaqiyatli olindi',
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Mahsulotlarni olishda xatolik yuz berdi',
      );
    }
  }
  

  // ✅ Get one product (public)
  async findOne(id: number) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
        include: { category: true, user: true },
      });

      if (!product) throw new NotFoundException('Product not found');
      return product;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  // ✅ Update Product (OWNER yoki ADMIN)
  async update(id: number, dto: UpdateProductDto, user: any, images: string[] = []) {
    try {
      const existing = await this.ensureProductExists(id);

      // faqat OWNER yoki ADMIN update qilishi mumkin
      this.checkOwnerOrAdmin(existing.userId, user);

      const updated = await this.prisma.product.update({
        where: { id },
        data: {
          ...dto,
          images: images.length > 0 ? images : existing.images,
        },
      });

      return { message: 'Product updated', data: updated };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  // ✅ Delete Product (OWNER yoki ADMIN)
  async remove(id: number, user: any) {
    try {
      const product = await this.ensureProductExists(id);

      // faqat OWNER yoki ADMIN delete qilishi mumkin
      this.checkOwnerOrAdmin(product.userId, user);

      await this.prisma.product.delete({ where: { id } });
      return { message: 'Product deleted successfully' };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
