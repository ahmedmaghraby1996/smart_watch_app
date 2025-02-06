import { AuditableEntity } from "src/infrastructure/base/auditable.entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { School } from "./school.entity";
@Entity()
export class DayHours extends AuditableEntity {

    @Column()
    name_ar: string

    @Column()
    name_en: string

    @Column()
    order_by: number

    @Column()
    start_time: string

    @Column()
    end_time: string

    @Column()
    is_active: boolean

    @ManyToOne(() => School, (school) => school.day_hours)
    @JoinColumn()
    school: School
    @Column({nullable:true})
    school_id:string
    

    constructor(partial: Partial<DayHours>) {
        super();
        Object.assign(this, partial);
    }


}