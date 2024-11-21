import { Expose, Transform } from 'class-transformer';
import { toUrl } from 'src/core/helpers/file.helper';
import { School } from 'src/infrastructure/entities/school/school.entity';

export class UserResponse {
  @Expose()
  id: string;
  @Expose()
  name: string;

  @Expose()
  phone: string;

  @Expose()
  gender: string;
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
  @Transform((value) => {
    return value.obj.school
      ? {
          id: value.obj.school.id,
          name: value.obj.school.name,
          avatar: toUrl(value.obj.school.avatar),
          code: value.obj.school.city_code,
        }
      : null;
  })
  school: School;
}
