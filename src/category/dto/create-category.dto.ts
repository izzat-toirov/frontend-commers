import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

export class CreateCategoryDto {
    @ApiProperty({ description: 'Category name' })
    @IsString()
    @Length(1, 100)
    name: string;
}
