//notification response dto

import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean, IsString } from 'class-validator';

export class NotificationResponse {
    @Expose() id: string;

    @Expose() title: string;
    
    @Expose() text: string;
    
    @Expose() url: string;
    
    @Expose() type: string;
    
    @Expose() is_read: boolean;

    @Expose() seen_at: Date;
    
    @Expose() created_at: Date;
}