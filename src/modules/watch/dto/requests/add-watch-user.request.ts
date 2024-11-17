import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { Gender } from 'src/infrastructure/data/enums/gender.enum';

export class AddWatchUserRequest {
  @ApiProperty()
  @IsString()
  IMEI: string;
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  
  phone: string;
  @ApiProperty()
  @ApiProperty({ default: Gender.MALE, enum: [Gender.MALE, Gender.FEMALE] })
  @IsEnum(Gender)
  gender: Gender;
  birth_date: string;
  avatar: string;
  @ApiProperty()
  @IsString()
  school_id: string;

  @ApiProperty({required: false,type: 'array',items: {type: 'string'}})
  @IsArray({each: true})
  @IsOptional()
  driver_ids: string[];

  @ApiProperty({ type: 'file', required: false })
  avatarFile: Express.Multer.File;
}
