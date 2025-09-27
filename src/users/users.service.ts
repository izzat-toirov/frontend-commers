import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../../generated/prisma';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // users.service.ts

  async createDefaultUsers() {
    try {
      // Bazada allaqachon userlar bor-yo‘qligini tekshiramiz
      const existingUsers = await this.prisma.user.findMany({
        where: { role: Role.USER },
      });

      if (existingUsers.length >= 20) {
        console.log('❗ Default 20 ta user allaqachon mavjud');
        return;
      }

      const usersToCreate = 20 - existingUsers.length;

      for (let i = 1; i <= usersToCreate; i++) {
        const email = `user${i}@gmail.com`;

        const existing = await this.prisma.user.findUnique({
          where: { email },
        });
        if (!existing) {
          const hashedPassword = await bcrypt.hash('user', 10);

          await this.prisma.user.create({
            data: {
              fname: `User${i}`,
              lname: `Test${i}`,
              email,
              password: hashedPassword,
              role: Role.USER,
              isActive: true,
              address: `Default address ${i}`,
            },
          });
          console.log(`✅ User${i} yaratildi`);
        }
      }
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Default userlarni yaratishda xatolik yuz berdi',
      );
    }
  }

  // 🔹 Super admin (OWNER) faqat 1 marta yaratiladi
  async createSuperAdmin() {
    try {
      const existingSuperAdmins = await this.prisma.user.findMany({
        where: { role: Role.OWNER },
      });

      if (existingSuperAdmins.length > 0) {
        console.log('❗ Super admin allaqachon mavjud');
        return existingSuperAdmins[0];
      }

      const hashedPassword = await bcrypt.hash('owner', 10);

      const superAdmin = await this.prisma.user.create({
        data: {
          fname: 'Super',
          lname: 'Admin',
          email: 'owner@gmail.com',
          password: hashedPassword,
          role: Role.OWNER,
          isActive: true,
          address: 'Head Office',
        },
      });

      console.log('✅ Super admin yaratildi');
      return superAdmin;
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Super admin yaratishda xatolik yuz berdi',
      );
    }
  }

  // 🔹 Oddiy foydalanuvchi yaratish
  async create(createUserDto: CreateUserDto) {
    try {
      const { fname, lname, address, email, password, role } = createUserDto;
      if (role && role !== Role.USER) {
        throw new BadRequestException(
          'Faqat USER roli bilan foydalanuvchi yaratish mumkin',
        );
      }

      const existingEmail = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existingEmail) {
        throw new BadRequestException(
          'Bu email bilan foydalanuvchi allaqachon mavjud',
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await this.prisma.user.create({
        data: {
          fname,
          lname,
          address,
          email,
          password: hashedPassword,
          role: Role.USER,
          isActive: false, // OTP tekshirilgandan keyin true bo‘ladi
        },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      return {
        message: 'User muvaffaqiyatli yaratildi',
        data: newUser,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        error.message || 'Foydalanuvchi yaratishda xatolik yuz berdi',
      );
    }
  }

  // 🔹 Barcha userlarni olish
  async findAll() {
    try {
      const users = await this.prisma.user.findMany();
      return { message: 'Foydalanuvchilar ro‘yxati olindi', data: users };
    } catch (error) {
      throw new InternalServerErrorException(
        'Foydalanuvchilarni olishda xatolik yuz berdi: ' + error.message,
      );
    }
  }

  // 🔹 Bitta userni olish
  async findOne(id: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });
      if (!user) {
        throw new NotFoundException(`ID ${id} ga teng user topilmadi`);
      }
      return { message: 'User topildi', data: user };
    } catch (error) {
      throw new InternalServerErrorException(
        'Userni olishda xatolik yuz berdi: ' + error.message,
      );
    }
  }

  // 🔹 Userni yangilash
  async update(id: number, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
      });
      return { message: 'User muvaffaqiyatli yangilandi', data: user };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`ID ${id} ga teng user topilmadi`);
      }
      throw new InternalServerErrorException(
        'Userni yangilashda xatolik yuz berdi: ' + error.message,
      );
    }
  }

  // 🔹 Userni o‘chirish (haqiqiy DELETE)
  async remove(id: number) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) throw new NotFoundException(`ID ${id} ga teng user topilmadi`);

      await this.prisma.user.update({
        where: { id },
        data: { isActive: false }, // soft delete
      });

      return { message: 'User deactivated successfully' };
    } catch (error) {
      throw new InternalServerErrorException(
        'Userni o‘chirishda xatolik yuz berdi: ' + error.message,
      );
    }
  }
}
