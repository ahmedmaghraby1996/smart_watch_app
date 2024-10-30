import { Expose, Transform } from "class-transformer";
import { toUrl } from "src/core/helpers/file.helper";
import { School } from "src/infrastructure/entities/school/school.entity";

export class UserResponse {
    @Expose()
    id: string;
    @Expose()
    name: string;
    @Expose()
    email: string;
    @Expose()
    @Transform(({ value }) => toUrl(value))
    avatar: string;
    @Expose()
    role: string;
    @Expose()
    created_at: Date;
    @Expose()
    @Transform(({ value }) => { return value??{
        id: value.id,
        name: value.name,
        avatar: toUrl(value.avatar)
    }})
    school:School

}