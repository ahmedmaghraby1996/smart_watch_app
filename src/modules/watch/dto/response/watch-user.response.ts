import { Expose, plainToInstance, Transform } from "class-transformer";
import { toUrl } from "src/core/helpers/file.helper";
import { School } from "src/infrastructure/entities/school/school.entity";
import { UserResponse } from "src/modules/user/dto/response/user-response";

export class WatchUserResponse  extends UserResponse{
  
    @Expose()
    @Transform(( value ) => value.obj.school?{id: value.obj.school.id, name: value.obj.school.name, avatar: toUrl(value.obj.school.avatar)}:null)
    school: School;
    @Expose()
    @Transform(( value ) => value.obj.driver?plainToInstance(UserResponse, value.obj.drivers, { excludeExtraneousValues: true }):null)
    drivers: UserResponse[];
    @Expose()
    @Transform(( value ) => value.obj.parent?plainToInstance(UserResponse, value.obj.parent, { excludeExtraneousValues: true }):null)
    parent: string;
}