import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
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

  @ApiProperty()
  @IsString()
  grade_id: string;
  
  @ApiPropertyOptional({
    type: [String],
    required: false,
    example: ['id1', 'id2'],
  })
  driver_ids: string;

  @ApiProperty({ type: 'file', required: false })
  avatarFile: Express.Multer.File;
}



export class EditWatchUserRequest {

  @ApiProperty()
  @IsUUID()
  id: string;
  @ApiProperty({required: false})
  @IsOptional()
  @IsString()
  IMEI: string;
  @ApiProperty({required: false})
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({required: false})
  @IsOptional()
  @IsString()
  
  phone: string;
  @ApiProperty({required: false,enum:[Gender.MALE, Gender.FEMALE]})
  @IsOptional()
  @IsEnum(Gender)
  gender: Gender;
  birth_date: string;
  avatar: string;
  @ApiProperty({required: false})
  @IsOptional()
  @IsString()
  school_id: string;
  @ApiProperty({required: false})
  @IsOptional()
  @IsString()
  grade_id: string;
  
  @ApiPropertyOptional({
    type: [String],
    required: false,
    example: ['id1', 'id2'],
  })
  driver_ids: string;

  @ApiProperty({ type: 'file', required: false })
  avatarFile: Express.Multer.File;
}