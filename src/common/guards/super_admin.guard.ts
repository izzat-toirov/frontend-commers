// import {
//   CanActivate,
//   ExecutionContext,
//   Injectable,
//   ForbiddenException,
// } from '@nestjs/common';
// import { PrismaService } from '../../prisma/prisma.service';
// import { Role } from '../../../generated/prisma'; // Enum Prisma'dan

// @Injectable()
// export class AdminGuard implements CanActivate {
//   constructor(private prisma: PrismaService) {}

//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     const request = context.switchToHttp().getRequest();
//     const creatingRole: Role = request.body?.role;

//     const userId = request.user?.id;
//     if (!userId) {
//       throw new ForbiddenException('Foydalanuvchi aniqlanmadi');
//     }

//     const currentUser = await this.prisma.user.findUnique({
//       where: { id: userId },
//     });

//     if (!currentUser) {
//       throw new ForbiddenException('Foydalanuvchi topilmadi');
//     }

//     const currentRole = currentUser.role;

//     // ❌ OWNER (SUPER_ADMIN) yaratish mumkin emas
//     if (creatingRole === Role.OWNER) {
//       throw new ForbiddenException('OWNER yaratish mumkin emas');
//     }

//     // ADMIN yaratishni faqat OWNER qila oladi
//     if (creatingRole === Role.ADMIN && currentRole !== Role.OWNER) {
//       throw new ForbiddenException('Faqat OWNER ADMIN yaratishi mumkin');
//     }

//     // USER yaratishni faqat ADMIN yoki OWNER qila oladi
//     if (creatingRole === Role.USER && ![Role.ADMIN, Role.OWNER].includes(currentRole)) {
//       throw new ForbiddenException('Faqat ADMIN yoki OWNER USER yaratishi mumkin');
//     }

//     return true;
//   }
// }
