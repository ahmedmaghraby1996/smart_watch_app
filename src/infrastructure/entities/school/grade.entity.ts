import { BaseEntity } from "src/infrastructure/base/base.entity";
import { AcademicStage } from "src/infrastructure/data/enums/academic-stage.enum";
import {  Column, Entity, ManyToMany, ManyToOne, OneToMany } from "typeorm";

@Entity()
export class Grade extends BaseEntity {
  
    
 @Column()
 name_ar:string   

 @Column()
 name_en:string

 @Column()
 order_by:number
 @Column({enum:AcademicStage})
 academic_stage:AcademicStage


 
}