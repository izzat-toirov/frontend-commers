import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { JwtGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('categories')
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories (public)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 20 })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['asc', 'desc'],
    example: 'asc',
  })
  async getAll(
    @Query('page') pageStr?: string,
    @Query('pageSize') pageSizeStr?: string,
    @Query('order') order: 'asc' | 'desc' = 'asc',
  ) {
    const page = !isNaN(Number(pageStr)) ? Number(pageStr) : 1;
    const pageSize = !isNaN(Number(pageSizeStr)) ? Number(pageSizeStr) : 20;

    return this.categoryService.findAll(page, pageSize, order);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by id (public)' })
  async getOne(@Param('id') id: string) {
    return this.categoryService.findOne(Number(id));
  }

  @Post()
  @ApiOperation({ summary: 'Create category (owner or admin)' })
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  async create(@Body() dto: CreateCategoryDto, @Req() req: any) {
    const user = req.user;
    if (!user) {
      throw new HttpException(
        { message: 'Unauthorized' },
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.categoryService.create(dto, user); // ✅ user ni to‘liq yuborish
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update category (owner or admin-owner)' })
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @Req() req: any,
  ) {
    const user = req.user;
    if (!user) {
      throw new HttpException(
        { message: 'Unauthorized' },
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.categoryService.update(Number(id), dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete category (owner or admin-owner)' })
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  async remove(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    if (!user) {
      throw new HttpException(
        { message: 'Unauthorized' },
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.categoryService.remove(Number(id), user);
  }
}
