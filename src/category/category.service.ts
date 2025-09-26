import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Role } from '../../generated/prisma';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async createDefaultCategories() {
    try {
      // Avval admin yoki super adminni topamiz
      let ownerOrAdmin = await this.prisma.user.findFirst({
        where: { OR: [{ role: Role.ADMIN }, { role: Role.OWNER }] },
      });
  
      if (!ownerOrAdmin) {
        console.log('❗ Default kategoriyalarni yaratish uchun admin/super admin mavjud emas');
        return;
      }
  
      // Bazada allaqachon kategoriyalar borligini tekshiramiz
      const existingCategories = await this.prisma.category.findMany();
      if (existingCategories.length >= 20) {
        console.log('❗ Default 20 ta kategoriyalar allaqachon mavjud');
        return;
      }
  
      const categoriesToCreate = 20 - existingCategories.length;
  
      for (let i = 1; i <= categoriesToCreate; i++) {
        const name = `Kategoriya ${i}`;
  
        const existing = await this.prisma.category.findFirst({ where: { name } });
  
        if (!existing) {
          await this.prisma.category.create({
            data: {
              name,
              userId: ownerOrAdmin.id, // kategoriya kimga tegishli bo‘ladi
            },
          });
          console.log(`✅ ${name} yaratildi`);
        }
      }
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Default kategoriyalarni yaratishda xatolik yuz berdi',
      );
    }
  }
  
  
  

  // 🔹 Create
  async create(createDto: CreateCategoryDto, user: any) {
    try {
      if (user.role === 'user') {
        throw new HttpException(
          { message: 'Forbidden: users cannot create categories' },
          HttpStatus.FORBIDDEN,
        );
      }

      const category = await this.prisma.category.create({
        data: { name: createDto.name, userId: user.id },
      });
      return { message: 'Category created successfully', data: category };
    } catch (err) {
      throw new HttpException(
        { message: 'Failed to create category', reason: err.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 🔹 Find all (public)
  async findAll(
    page = 1,
    pageSize = 20,
    order: 'asc' | 'desc' = 'asc', // default tartib
  ) {
    try {
      const skip = (page - 1) * pageSize;
  
      const [items, total] = await Promise.all([
        this.prisma.category.findMany({
          skip,
          take: pageSize,
          orderBy: { createdAt: order },
        }),
        this.prisma.category.count(),
      ]);
  
      return {
        message: 'Categories fetched',
        data: { items, total, page, pageSize, order },
      };
    } catch (err) {
      throw new HttpException(
        { message: 'Failed to fetch categories', reason: err.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  

  // 🔹 Find one (public)
  async findOne(id: number) {
    try {
      const category = await this.prisma.category.findUnique({ where: { id } });
      if (!category)
        throw new NotFoundException({ message: 'Category not found' });
      return { message: 'Category fetched', data: category };
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new HttpException(
        { message: 'Failed to fetch category', reason: err.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 🔹 Update
  async update(id: number, updateDto: UpdateCategoryDto, user: any) {
    try {
      if (user.role === 'user') {
        throw new HttpException(
          { message: 'Forbidden: users cannot update categories' },
          HttpStatus.FORBIDDEN,
        );
      }

      const existing = await this.prisma.category.findUnique({ where: { id } });
      if (!existing)
        throw new NotFoundException({ message: 'Category not found' });

      if (user.role === 'admin' && existing.userId !== user.id) {
        throw new HttpException(
          { message: 'Forbidden: admins can only modify their own categories' },
          HttpStatus.FORBIDDEN,
        );
      }

      const updated = await this.prisma.category.update({
        where: { id },
        data: { ...updateDto },
      });
      return { message: 'Category updated', data: updated };
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        { message: 'Failed to update category', reason: err.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 🔹 Delete
  async remove(id: number, user: any) {
    try {
      if (user.role === 'user') {
        throw new HttpException(
          { message: 'Forbidden: users cannot delete categories' },
          HttpStatus.FORBIDDEN,
        );
      }

      const existing = await this.prisma.category.findUnique({ where: { id } });
      if (!existing)
        throw new NotFoundException({ message: 'Category not found' });

      if (user.role === 'admin' && existing.userId !== user.id) {
        throw new HttpException(
          { message: 'Forbidden: admins can only delete their own categories' },
          HttpStatus.FORBIDDEN,
        );
      }

      await this.prisma.category.delete({ where: { id } });
      return { message: 'Category deleted' };
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        { message: 'Failed to delete category', reason: err.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
