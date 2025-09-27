import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";

export class LoginAuthDto {
    @ApiProperty({ example: 'superAdmin@gmail.com' })
    @IsEmail()
    email: string

    @ApiProperty({ example: 'owner' })
    @IsString()
    password: string
}