import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNumber, IsString } from "class-validator";

export class ConfirmRequest {
    @ApiProperty()
    @IsString()
    request_id: string

    @ApiProperty()
    @Transform(({ value }) => Number(value))
    @IsNumber()
   
    code: number
}