import { AuditableEntity } from "src/infrastructure/base/auditable.entity";
import { Column, Entity, JoinColumn, OneToMany, OneToOne } from "typeorm";
import { WatchUser } from "../watch-user/watch-user.entity";
import { User } from "../user/user.entity";
import { OwnedEntity } from "src/infrastructure/base/owned.entity";

@Entity()
export class School extends OwnedEntity 
{

    @Column()
    name: string

    @Column({nullable:true})
    avatar: string

    @OneToOne(()=>User,(user)=>user.school)
    @JoinColumn()
    user: User


    @OneToMany(()=>User, (user) => user.school)
    security: User[]
    @OneToMany(()=>WatchUser, (watchUser) => watchUser.school)
    watchUsers: WatchUser[]
    
    constructor(partial: Partial<School>) {
        super();
        Object.assign(this, partial);
    }
}