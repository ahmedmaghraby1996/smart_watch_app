import { BaseEntity } from "src/infrastructure/base/base.entity";
import { Column, Entity, OneToOne } from "typeorm";
import { WatchUser } from "./watch-user.entity";

@Entity()
export class IMEI_entity extends BaseEntity{

    @Column({unique:true,})
    IMEI: string

    @OneToOne(() => WatchUser, (watchUser) => watchUser.IMEI)
    watch_user: WatchUser

    constructor(partial: Partial<IMEI_entity>) {
        super();
        Object.assign(this, partial);
      }
 }