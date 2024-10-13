import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  isStrongPassword,
} from 'class-validator';
import { Unique } from 'src/core/validators/unique-constraints.validator';
import { Gender } from 'src/infrastructure/data/enums/gender.enum';
import { Role } from 'src/infrastructure/data/enums/role.enum';


export class RegisterRequest {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsStrongPassword()
  password: string;



  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  @IsEmail()
  @Unique('User')
  email?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  birth_date:string

  @ApiPropertyOptional()
  @IsOptional()
  @ApiProperty({ default: Gender.MALE, enum: [Gender.MALE, Gender.FEMALE] })
  @IsEnum(Gender)
  gender: Gender;
  @ApiProperty()
  @IsNotEmpty()
  @Unique('User')
  phone: string;



  @ApiProperty({ type: 'file', required: false })
  @IsOptional()
  avatarFile: Express.Multer.File;

  @ApiProperty({ default: Role.PARENT, enum: [Role.PARENT, Role.SECURITY,Role.DRIVER ] })
  @IsNotEmpty()
  @IsEnum(Role)
  role: Role;
}
    