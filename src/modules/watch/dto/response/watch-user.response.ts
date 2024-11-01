import { Expose } from "class-transformer";

export class WatchUserResponse {
    @Expose()
    id: string;

    @Expose()
    driver_id: string;
    parent_id: string;
}