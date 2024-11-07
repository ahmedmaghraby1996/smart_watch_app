import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty,IsOptional,IsString } from 'class-validator';

export class sendNotificationRequest {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ nullable: true, required: false })
  @IsOptional()
  @IsString()
  phone: string;
  constructor(sendNotificationRequest: Partial< sendNotificationRequest>) {
    Object.assign(this, sendNotificationRequest);
  }
}
