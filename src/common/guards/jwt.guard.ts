import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request | any = context.switchToHttp().getRequest();
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Token mavjud emas');
    }

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedException('Token noto‘g‘ri formatda');
    }

    let payload: any;
    try {
      payload = await this.jwtService.verify(token, {
        secret: process.env.ACCESS_TOKEN_KEY,
      });
    } catch (error) {
      throw new UnauthorizedException('Token noto‘g‘ri yoki muddati tugagan');
    }

    if (!payload) {
      throw new UnauthorizedException('Token noto‘g‘ri');
    }

    // ✅ Email tasdiqlangan user faqat ishlashi mumkin
    if (!payload.isActive) {
      throw new ForbiddenException('Siz faol foydalanuvchi emassiz');
    }

    req.user = payload; // controllerlarda GetUser orqali ishlatish uchun
    return true;
  }
}
