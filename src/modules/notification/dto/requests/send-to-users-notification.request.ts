import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class SendToUsersNotificationRequest {
  @ApiProperty()
  @IsNotEmpty()
  @IsArray()
  users_id: string[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  message_ar: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  message_en: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title_ar: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title_en: string;
}
