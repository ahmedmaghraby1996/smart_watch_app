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
        @Transform((school) => { return school.value??{
            id: school.value.id,
            name: school.value.name,
            avatar: toUrl(school.value.avatar)
        }})
    school:School

}