import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // istasangiz olib tashlashingiz mumkin
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // service ni boshqa modullarga chiqaramiz
})
export class PrismaModule {}
