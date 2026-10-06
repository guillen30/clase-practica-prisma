import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  IsInt,
  Min,
  IsEnum,
} from 'class-validator';
import { Role } from '@prisma/client';
export class CreateUserDto {
  @ApiProperty({ example: 'nuevo@clase.local' }) @IsEmail() email!: string;
  @ApiPropertyOptional({ example: 'Nuevo Usuario' })
  @IsOptional()
  @IsString()
  name?: string;
  @ApiProperty({ example: 'Practica123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() telephone?: string;
  @ApiProperty({ example: 1 }) @IsInt() @Min(1) tenantId!: number;
  @ApiPropertyOptional({ enum: Role, default: Role.USER })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
