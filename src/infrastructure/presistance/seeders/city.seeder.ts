import { Injectable } from '@nestjs/common';
import { Seeder,  } from 'nestjs-seeder';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';

import { City } from 'src/infrastructure/entities/school/city.entity';

@Injectable()
export class citySeeder implements Seeder {
    constructor(
        @InjectRepository(City)
        private readonly cityRepository: Repository<City>,
    ) { }

    async seed(): Promise<any> {
        const data = fs.readFileSync('./json/cities.json', 'utf8');
        const staticPagesData: City[] = JSON.parse(data);

        for (const data of staticPagesData) {
            const city = this.cityRepository.create(data);

            await this.cityRepository.save(city);
        }
    }

    async drop(): Promise<any> {
        return await this.cityRepository.delete({});
    }
}