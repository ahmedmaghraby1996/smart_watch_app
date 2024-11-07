import { ApiProperty } from "@nestjs/swagger";
import { IsArray } from "class-validator";

export class ReadNotificationsRequest {
    @ApiProperty()
    @IsArray()
    notification_ids: string[];
}