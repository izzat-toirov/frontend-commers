import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/mail/mail.service';
import { totp } from 'otplib';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { Role } from '../../generated/prisma';
import { Response } from 'express';

totp.options = { step: 300 };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly jwt: JwtService,
  ) {}

  // -------------------- OTP --------------------
  async sendOtp(sendOtpDto: SendOtpDto) {
    try {
      const otp = totp.generate(sendOtpDto.email + 'secret-key');
      await this.mail.sendSmsToMail(
        sendOtpDto.email,
        'Verification code',
        '..........',
        `<div style="text-align: center; background-color: gray; color: white; font-size: 30px; margin-top: 20px"><h1>${otp}</h1></div>`,
      );
      return { message: 'Verification code sent successfully' };
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Internal server error',
      );
    }
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    try {
      const isValid = totp.verify({
        token: verifyOtpDto.otp,
        secret: verifyOtpDto.email + 'secret-key',
      });
      if (!isValid) return { valid: false, message: 'Invalid or expired OTP' };

      await this.prisma.user.update({
        where: { email: verifyOtpDto.email },
        data: { isActive: true },
      });
      return { valid: true, message: 'Email verified successfully' };
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Internal server error',
      );
    }
  }

  // -------------------- REGISTER --------------------
  // -------------------- REGISTER --------------------
  async register(data: CreateUserDto) {
    try {
      const existing = await this.prisma.user.findFirst({
        where: { email: data.email },
      });
      if (existing) throw new BadRequestException('User already exists');

      const hashedPassword = bcrypt.hashSync(data.password, 10);

      // ❗️ Faqat USER bo'lishi kerak
      const user = await this.prisma.user.create({
        data: {
          fname: data.fname,
          lname: data.lname || null,
          email: data.email,
          password: hashedPassword,
          address: data.address || null,
          role: Role.USER, // default USER
          isActive: false, // email tasdiqlanmaguncha false
        },
      });

      return {
        message: 'User registered successfully',
        data: { id: user.id, email: user.email, role: user.role },
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        error.message || 'Internal server error',
      );
    }
  }

  // -------------------- LOGIN --------------------
  async login(loginAuthDto: LoginAuthDto, req: Request, res: any) {
    try {
      const user = await this.prisma.user.findFirst({
        where: { email: loginAuthDto.email },
      });
      if (!user) throw new BadRequestException('User not found');

      const matchPassword = bcrypt.compareSync(
        loginAuthDto.password,
        user.password,
      );
      if (!matchPassword) throw new BadRequestException('Invalid credentials');

      if (!user.isActive) {
        throw new BadRequestException('Please verify your email before login');
      }

      const accessToken = this.jwt.sign(
        { id: user.id, role: user.role, isActive: user.isActive },
        { expiresIn: process.env.ACCESS_TOKEN_TIME || '30m' },
      );

      const refreshToken = this.jwt.sign(
        { id: user.id, role: user.role, isActive: user.isActive },
        { expiresIn: process.env.REFRESH_TOKEN_TIME || '15d' },
      );

      const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { hashedRefreshToken },
      });

      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 24 * 60 * 60 * 1000,
      });

      return {
        message: 'Login successful',
        data: {
          access_token: accessToken,
          user: { id: user.id, email: user.email, role: user.role },
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        error.message || 'Internal server error',
      );
    }
  }

  // -------------------- REFRESH TOKEN --------------------
  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      const { refreshToken } = refreshTokenDto;
      if (!refreshToken)
        throw new BadRequestException('RefreshToken not found');

      const decoded = this.jwt.verify(refreshToken) as {
        id: number;
        role: Role;
      };
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.id },
      });
      if (!user || !user.hashedRefreshToken) throw new UnauthorizedException();

      const isValid = await bcrypt.compare(
        refreshToken,
        user.hashedRefreshToken,
      );
      if (!isValid) throw new UnauthorizedException('Invalid refresh token');

      const newAccessToken = this.jwt.sign(
        { id: user.id, role: user.role },
        { expiresIn: process.env.ACCESS_TOKEN_TIME || '30m' },
      );

      return {
        message: 'New access token generated',
        accessToken: newAccessToken,
      };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new InternalServerErrorException(
        error.message || 'Internal server error',
      );
    }
  }

  // -------------------- LOGOUT --------------------

  async logout(userId: number, res: Response) {
    try {
      // 1️⃣ Refresh tokenni bazada tozalash
      await this.prisma.user.update({
        where: { id: userId },
        data: { hashedRefreshToken: null },
      });

      // 2️⃣ Cookie’ni tozalash
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: true, // https bo‘lsa
        sameSite: 'strict',
        path: '/',
      });

      return { message: 'Logged out successfully' };
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Internal server error',
      );
    }
  }

  // -------------------- GET PROFILE --------------------
  async getProfile(userId: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          fname: true,
          lname: true,
          email: true,
          role: true,
          address: true,
          isActive: true,
          createdAt: true,
        },
      });
      if (!user) throw new BadRequestException('User not found');
      return { message: 'User profile fetched successfully', data: user };
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Internal server error',
      );
    }
  }

  // -------------------- MAKE ADMIN --------------------
  async makeAdmin(ownerId: number, userId: number) {
    try {
      const owner = await this.prisma.user.findUnique({
        where: { id: ownerId },
      });
      if (!owner || owner.role !== Role.OWNER)
        // ✅ enum bilan tekshirish
        throw new ForbiddenException('Only owner can promote users to admin');

      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new BadRequestException('User not found');

      const updated = await this.prisma.user.update({
        where: { id: userId },
        data: { role: Role.ADMIN }, // ✅ enum orqali ADMIN
      });

      return {
        message: 'User promoted to admin successfully',
        data: { id: updated.id, role: updated.role },
      };
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new InternalServerErrorException(
        error.message || 'Internal server error',
      );
    }
  }
}
