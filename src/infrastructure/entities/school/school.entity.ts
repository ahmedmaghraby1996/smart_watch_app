import { AuditableEntity } from "src/infrastructure/base/auditable.entity";
import { Column, Entity, OneToMany } from "typeorm";
import { WatchUser } from "../watch-user/watch-user.entity";
import { User } from "../user/user.entity";

@Entity()
export class School extends AuditableEntity 
{

    @Column()
    name_ar: string

    @Column()
    name_en: string

    @Column({nullable:true})
    avatar: string

    @OneToMany(()=>User, (user) => user.school)
    security: User[]
    @OneToMany(()=>WatchUser, (watchUser) => watchUser.school)
    watchUsers: WatchUser[]
    
    
}