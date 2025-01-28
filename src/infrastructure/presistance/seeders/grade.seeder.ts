import { Injectable } from '@nestjs/common';
import { Seeder,  } from 'nestjs-seeder';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';

import { Grade } from 'src/infrastructure/entities/school/grade.entity';

@Injectable()
export class gradeSeeder implements Seeder {
    constructor(
        @InjectRepository(Grade)
        private readonly gradeRepository: Repository<Grade>,
    ) { }

    async seed(): Promise<any> {
        const data = fs.readFileSync('./json/grades.json', 'utf8');
        const staticPagesData: Grade[] = JSON.parse(data);

        for (const data of staticPagesData) {
            const grade = this.gradeRepository.create(data);

            await this.gradeRepository.save(grade);
        }
    }

    async drop(): Promise<any> {
        return await this.gradeRepository.delete({});
    }
}