import { Expose, plainToInstance, Transform } from "class-transformer";
import { UserResponse } from "src/modules/user/dto/response/user-response";

export class WatchRequestResponse {
    @Expose()
    id: string;
    @Expose()
    user_id: string;
    @Expose()
    watch_user_id: string;
    @Expose()
    created_at: Date;
    @Expose()
    code: number
    @Expose()
    @Transform(({ value }) => plainToInstance(UserResponse, value)) 
    user: UserResponse
}