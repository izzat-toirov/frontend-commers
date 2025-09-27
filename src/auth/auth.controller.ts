import {
  Controller,
  Post,
  Body,
  Req,
  Get,
  UseGuards,
  Param,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';

import type { Request, Response } from 'express';
import { JwtGuard } from '../common/guards/jwt.guard';
import { GetUser } from '../common/guards/getUser';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // -------------------- OTP --------------------
  @Post('send-otp')
  @ApiOperation({ summary: 'Send OTP to email' })
  @ApiBody({ type: SendOtpDto })
  sendOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.authService.sendOtp(sendOtpDto);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP code' })
  @ApiBody({ type: VerifyOtpDto })
  verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  // -------------------- REGISTER --------------------
  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  @ApiBody({ type: CreateUserDto })
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  // -------------------- LOGIN --------------------
  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginAuthDto })
  login(
    @Body() loginDto: LoginAuthDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response, // ✅ Response ishlatilmoqda
  ) {
    return this.authService.login(loginDto, req, res);
  }

  // -------------------- REFRESH TOKEN --------------------
  @Post('refresh-token')
  @ApiOperation({ summary: 'Get new access token using refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  // -------------------- LOGOUT --------------------
  @Post('logout')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Logout user (remove refresh token)' })
  async logout(
    @GetUser('id') userId: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.logout(userId, res);
  }
  

  // -------------------- PROFILE --------------------
  @Get('profile')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get logged in user profile' })
  getProfile(@GetUser('id') userId: number) {
    return this.authService.getProfile(userId);
  }

  // -------------------- MAKE ADMIN --------------------
  @Post('make-admin/:id')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Promote user to admin (Owner only)' })
  makeAdmin(@GetUser('id') ownerId: number, @Param('id') userId: number) {
    return this.authService.makeAdmin(ownerId, +userId);
  }
}
