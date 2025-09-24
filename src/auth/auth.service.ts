import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/mail/mail.service';
import { totp } from 'otplib';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import DeviceDetector from 'device-detector-js';

import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

import { LoginAuthDto } from './dto/login-auth.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';

totp.options = {
  step: 300, 
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly jwt: JwtService,
  ) {}

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
  
      if (!isValid) {
        return { valid: false };
      }
  
      // OTP to‘g‘ri bo‘lsa, userni isActive true qilamiz
      await this.prisma.user.update({
        where: { email: verifyOtpDto.email },
        data: { isActive: true },
      });
  
      return { valid: true };
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Internal server error',
      );
    }
  }
  
  async register(data: CreateUserDto) {
    try {
      const existing = await this.prisma.user.findFirst({
        where: { email: data.email },
      });
      if (existing) throw new BadRequestException('User already exists');

      const hashedPassword = bcrypt.hashSync(data.password, 10);

      return await this.prisma.user.create({
        data: { ...data, password: hashedPassword },
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        error.message || 'Internal server error',
      );
    }
  }

  async login(loginAuthDto: LoginAuthDto, req: Request) {
    try {
      const user = await this.prisma.user.findFirst({
        where: { email: loginAuthDto.email },
      });
      if (!user) throw new BadRequestException('User not found');
  
      const matchPassword = bcrypt.compareSync(loginAuthDto.password, user.password);
      if (!matchPassword) throw new BadRequestException('Invalid credentials');
  
      // Tokenlarni yaratish .env bilan
      const accessToken = this.jwt.sign(
        { id: user.id, role: user.role },
        { expiresIn: process.env.ACCESS_TOKEN_TIME || '30m' }
      );
  
      const refreshToken = this.jwt.sign(
        { id: user.id, role: user.role },
        { expiresIn: process.env.REFRESH_TOKEN_TIME || '15d' }
      );
  
      // Device va IP olish
      const deviceDetector = new DeviceDetector();
      const device = deviceDetector.parse(req.headers['user-agent'] || '');
      const deviceName = `${device.client?.name || 'Unknown Client'} on ${device.os?.name || 'Unknown OS'}`;
      const userIp = req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown';
  
      await this.prisma.session.create({
        data: {
          userId: user.id,
          userIp,
          device: deviceName,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
      });
      
  
      // Response Frontend uchun
      return {
        status: 'success',
        data: {
          access_token: accessToken,
          refresh_token: refreshToken,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
          },
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(error.message || 'Internal server error');
    }
  }
  
  

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      const { refreshToken } = refreshTokenDto;
      if (!refreshToken) throw new BadRequestException('RefreshToken not found');

      const verifyToken = this.jwt.verify(refreshToken);
      const user = await this.prisma.user.findFirst({
        where: { id: verifyToken.id },
      });
      if (!user) throw new UnauthorizedException('User not found');

      const newAccessToken = this.jwt.sign(
        { id: user.id, role: user.role },
        { expiresIn: '15m' },
      );

      return { accessToken: newAccessToken };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        error.message || 'Internal server error',
      );
    }
  }

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
      return { status: 'success', data: user };
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Internal server error',
      );
    }
  }
  
}
