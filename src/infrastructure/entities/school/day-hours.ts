import { AuditableEntity } from "src/infrastructure/base/auditable.entity";
import { Column, Entity } from "typeorm";
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

    constructor(partial: Partial<DayHours>) {
        super();
        Object.assign(this, partial);
    }


}