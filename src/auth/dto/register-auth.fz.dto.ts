import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsPhoneNumber, IsString, IsUUID } from "class-validator";
import { UUID } from "crypto";

export class RegisterAuthFz {
    @ApiProperty({ example: 'fullname' })
    @IsString()
    fullname: string

    @ApiProperty({ example: 'parol' })
    @IsString()
    password: string


    @ApiProperty({ example: 'nimadir@gmail.com' })
    @IsEmail()
    email: string

}