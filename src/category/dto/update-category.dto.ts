import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';
import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
    @ApiProperty({ description: 'Category name (optional)', required: false })
    @IsOptional()
    @IsString()
    @Length(1, 100)
    name?: string;
}
