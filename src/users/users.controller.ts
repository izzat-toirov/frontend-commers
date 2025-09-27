import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport'; 
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @Roles('owner', 'admin')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Req() req) {
    const user = req.user;

    // Admin faqat o'zini update qilishi mumkin
    if (user.role === 'admin' && user.id !== +id) {
      return { message: 'Siz boshqa foydalanuvchini tahrirlay olmaysiz' };
    }

    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @Roles('owner', 'admin')
  remove(@Param('id') id: string, @Req() req) {
    const user = req.user;

    // Admin faqat o'zini o'chirishi mumkin
    if (user.role === 'admin' && user.id !== +id) {
      return { message: 'Siz boshqa foydalanuvchini o‘chirishingiz mumkin emas' };
    }

    return this.usersService.remove(+id);
  }
}
