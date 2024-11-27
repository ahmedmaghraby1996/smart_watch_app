import { ApiProperty } from "@nestjs/swagger";

export class ImportImeiRequest {
    @ApiProperty({ type: 'file', required: true })
    file: Express.Multer.File;
}