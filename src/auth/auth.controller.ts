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

import type { Request } from 'express';
import { JwtGuard } from '../common/guards/jwt.guard';
import { GetUser } from '../common/guards/getUser';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // -------------------- OTP --------------------
  @Post('send-otp')
  @ApiOperation({ summary: 'Send OTP to email' })
  sendOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.authService.sendOtp(sendOtpDto);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP code' })
  verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  // -------------------- REGISTER --------------------
  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  // -------------------- LOGIN --------------------
  @Post('login')
  login(
    @Body() loginDto: LoginAuthDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response, // cookie yozish uchun
  ) {
    return this.authService.login(loginDto, req, res);
  }

  // -------------------- REFRESH TOKEN --------------------
  @Post('refresh-token')
  @ApiOperation({ summary: 'Get new access token using refresh token' })
  refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  // -------------------- LOGOUT --------------------
  @Post('logout')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Logout user (remove refresh token)' })
  logout(@GetUser('id') userId: number) {
    return this.authService.logout(userId);
  }

  // -------------------- PROFILE --------------------
  @Get('profile')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get logged in user profile' })
  getProfile(@GetUser('id') userId: number) {
    return this.authService.getProfile(userId);
  }
}
