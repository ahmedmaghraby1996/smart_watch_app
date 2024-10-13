import { AuditableEntity } from "src/infrastructure/base/auditable.entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { WatchUser } from "./watch-user.entity";
@Entity()
export class WatchRequest extends AuditableEntity{

  @ManyToOne(() => WatchUser, (watchUser) => watchUser.requests)
  @JoinColumn({ name: 'watch_user_id' })
  watchUser: WatchUser 

  @Column()
  watch_user_id: string


  @Column()
  code:number


  
}