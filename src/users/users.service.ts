import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../../generated/prisma';
import * as bcrypt from 'bcrypt';


@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createSuperAdmin() {
    try {
      const existingSuperAdmins = await this.prisma.user.findMany({
        where: { role: Role.OWNER },
      });

      if (existingSuperAdmins.length > 0) {
        console.log('❗ Super admin allaqachon mavjud');
        return existingSuperAdmins[0];
      }

      const hashedPassword = await bcrypt.hash('MySecureP@ss1', 10);

      const superAdmin = await this.prisma.user.create({
        data: {
          fname: 'Super',
          lname: 'Admin',
          email: 'superAdmin@gmail.com',
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
      return await this.prisma.user.create({
        data: {
          fname,
          lname,
          address,
          email,
          password: hashedPassword,
          role: Role.USER,
          isActive: false,
        },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Foydalanuvchi yaratishda xatolik yuz berdi',
      );
    }
  }

  async findAll() {
    try {
      return await this.prisma.user.findMany();
    } catch (error) {
      throw new InternalServerErrorException('Foydalanuvchilarni olishda xatolik yuz berdi: ' + error.message);
    }
  }

  async findOne(id: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });
      if (!user) {
        throw new NotFoundException(`ID ${id} ga teng user topilmadi`);
      }
      return user;
    } catch (error) {
      throw new InternalServerErrorException('Userni olishda xatolik yuz berdi: ' + error.message);
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
      });
      return user;
    } catch (error) {
      if (error.code === 'P2025') {
        // Prisma "Record not found" xatosi
        throw new NotFoundException(`ID ${id} ga teng user topilmadi`);
      }
      throw new InternalServerErrorException('Userni yangilashda xatolik yuz berdi: ' + error.message);
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`ID ${id} ga teng user topilmadi`);
      }
      throw new InternalServerErrorException('Userni o‘chirishda xatolik yuz berdi: ' + error.message);
    }
  }
}
