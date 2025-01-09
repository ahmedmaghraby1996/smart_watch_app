import { BaseEntity } from 'src/infrastructure/base/base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { School } from './school.entity';

@Entity()
export class City extends BaseEntity {
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
