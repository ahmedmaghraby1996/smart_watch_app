import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, Matches } from "class-validator";

export class UpdateSchoolWorkHoursRequest {

  @ApiProperty({ example: '1', description: 'Day hour id' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: '12:30 PM', description: 'Start time in the format HH:MM AM/PM' })
  @IsString()
  @IsOptional()
  @Matches(/^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/, {
    message: 'start_time must be in the format HH:MM AM/PM',
  })
  start_time: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Matches(/^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/, {
    
  })
  end_time: string;

  @ApiProperty()
  @IsString()
 
  @IsOptional()
  is_active: boolean;
}