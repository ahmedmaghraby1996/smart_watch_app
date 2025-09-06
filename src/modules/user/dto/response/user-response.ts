import { Expose, Transform } from 'class-transformer';
import { toUrl } from 'src/core/helpers/file.helper';
import { City } from 'src/infrastructure/entities/school/city.entity';
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
          city_code: value.obj.school.city_code,
          city_id: value.obj.school.city_id,
          academic_stage: value.obj.school.academic_stage,
        }
      : null;
  })
  school: School;
  @Expose()
  @Transform((value) => {
    return value.obj?.city
      ? {
          id: value.obj.city.id,
          name_ar: value.obj.city?.name_ar,
          name_en: value.obj.city?.name_en,
        }
      : null;
  })
  city: City;

  @Expose()
  completed_requests: number;
  @Expose()
  confirmed_requests: number;
  @Expose()
  pending_requests: number;
}
