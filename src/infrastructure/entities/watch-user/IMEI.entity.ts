import { BaseEntity } from "src/infrastructure/base/base.entity";
import { Column, Entity, OneToOne } from "typeorm";
import { WatchUser } from "./watch-user.entity";

@Entity()
export class IMEI extends BaseEntity{

    @Column()
    IMEI: string

    @OneToOne(() => WatchUser, (watchUser) => watchUser.IMEI)
    watchUser: WatchUser
 }