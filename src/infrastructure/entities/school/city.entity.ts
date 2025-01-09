import { BaseEntity } from 'src/infrastructure/base/base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { School } from './school.entity';
import { AuditableEntity } from 'src/infrastructure/base/auditable.entity';

@Entity()
export class City extends AuditableEntity {
  @Column()
  name_ar: string;

  @Column()
  name_en: string;

  @Column()
  order_by: number;
  @Column({ unique: true })
  code: string;
  @ManyToOne(() => School, (school) => school.city)
  schools: School[];
}
