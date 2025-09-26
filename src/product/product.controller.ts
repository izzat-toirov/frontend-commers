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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { ProductService } from './product.service';
import { JwtGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // CREATE PRODUCT
  @Post()
  @ApiOperation({ summary: 'Create product (owner/admin)' })
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'images', maxCount: 5 }], {
      storage: diskStorage({
        destination: './uploads/products', // saqlash papkasi
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, uniqueSuffix + extname(file.originalname));
        },
      }),
    }),
  )
  async create(
    @Body() dto: CreateProductDto,
    @UploadedFiles() files: { images?: Express.Multer.File[] },
    @Req() req: any,
  ) {
    const user = req.user;
    if (!user) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);

    // Fayllardan URL larni olish
    const imagePaths =
      files?.images?.map((file) => `/uploads/products/${file.filename}`) || [];

    return this.productService.create(dto, user, imagePaths);
  }

  // UPDATE PRODUCT
  @Put(':id')
  @ApiOperation({ summary: 'Update product (owner/admin-owner)' })
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'images', maxCount: 5 }], {
      storage: diskStorage({
        destination: './uploads/products',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, uniqueSuffix + extname(file.originalname));
        },
      }),
    }),
  )
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @UploadedFiles() files: { images?: Express.Multer.File[] },
    @Req() req: any,
  ) {
    const user = req.user;
    if (!user) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);

    const imagePaths =
      files?.images?.map((file) => `/uploads/products/${file.filename}`) || [];

    return this.productService.update(Number(id), dto, user, imagePaths);
  }

  // GET ALL
  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'brand', required: false, type: String, example: 'Apple' })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'iPhone' })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['price', 'createdAt'],
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  async findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('categoryId') categoryId?: number,
    @Query('userId') userId?: number,
    @Query('brand') brand?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: 'price' | 'createdAt',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    try {
      return await this.productService.findAll({
        page: page ? Number(page) : 1,
        pageSize: pageSize ? Number(pageSize) : 20,
        categoryId: categoryId ? Number(categoryId) : undefined,
        userId: userId ? Number(userId) : undefined,
        brand,
        search,
        sortBy,
        sortOrder,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Mahsulotlarni olishda xatolik yuz berdi',
      );
    }
  }

  // GET ONE
  @Get(':id')
  @ApiOperation({ summary: 'Get product by id (public)' })
  async findOne(@Param('id') id: string) {
    return this.productService.findOne(Number(id));
  }

  // DELETE
  @Delete(':id')
  @ApiOperation({ summary: 'Delete product (owner/admin-owner)' })
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  async remove(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    if (!user) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.productService.remove(Number(id), user);
  }
}
