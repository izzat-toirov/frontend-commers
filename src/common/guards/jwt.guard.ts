import {
    BadRequestException,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
  } from "@nestjs/common";
  import { JwtService } from "@nestjs/jwt";
  import { Request } from "express";
  
  @Injectable()
  export class JwtGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) {}
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const req: Request | any = context.switchToHttp().getRequest();
      const authHeader = req.headers.authorization;
  
      if (!authHeader) {
        throw new UnauthorizedException("Token mavjud emas");
      }
  
      const [bearer, token] = authHeader.split(" ");
      if (bearer !== "Bearer" || !token) {
        throw new UnauthorizedException("Token noto‘g‘ri formatda");
      }
  
      let payload: any;
      try {
        payload = await this.jwtService.verify(token, {
          secret: process.env.ACCESS_TOKEN_KEY,
        });
      } catch (error) {
        console.log(error);
        throw new BadRequestException("Token tekshirishda xatolik");
      }
  
      if (!payload) {
        throw new UnauthorizedException("Token noto‘g‘ri");
      }
      console.log(payload.is_active);
      
      if (!payload.is_active) {
        throw new ForbiddenException("Siz faol foydalanuvchi emassiz");
      }
  
      req.user = payload;
      return true;
    }
  }
  