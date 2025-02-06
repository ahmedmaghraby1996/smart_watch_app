import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches } from "class-validator";

export class UpdateSchoolWorkHoursRequest {

  @ApiProperty({ example: '1', description: 'Day hour id' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: '12:30 ', description: 'Start time in the format HH:MM AM/PM' })
  @IsString()
  @IsOptional()

  start_time: string;

  @ApiProperty()
  @IsString()
  @IsOptional()

  end_time: string;

  @ApiProperty()
  @IsBoolean()
 
  @IsOptional()
  is_active: boolean;
}