import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { ProductService } from '../../product/product.service';


@Injectable()
export class SelfOrRolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private productService: ProductService, // yoki CategoryService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceId = +request.params.id;

    // OWNER doim ruxsat oladi
    if (user.role === 'owner') return true;

    // Agar admin bo‘lsa, o‘ziga tegishli resource bo‘lishi shart
    if (user.role === 'admin') {
      if (request.baseUrl.includes('/product')) {
        const product = await this.productService.findOne(resourceId);
        if (product.userId === user.id) return true;
      }

      if (request.baseUrl.includes('/category')) {
        // CategoryService dan tekshiradi
      }

      throw new ForbiddenException('Siz faqat o‘zingiz yaratgan resursni boshqarishingiz mumkin');
    }

    // Userlar faqat o‘z profillarini update/delete qilishi mumkin
    if (roles?.includes(user.role) && user.id === resourceId) {
      return true;
    }

    throw new ForbiddenException('Ruxsat yo‘q');
  }
}
