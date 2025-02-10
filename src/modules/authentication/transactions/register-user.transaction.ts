import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, EntityManager, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RegisterRequest } from '../dto/requests/register.dto';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { randStr } from 'src/core/helpers/cast.helper';
import { BaseTransaction } from 'src/core/base/database/base.transaction';
import { ImageManager } from 'src/integration/sharp/image.manager';
import * as sharp from 'sharp';
import { StorageManager } from 'src/integration/storage/storage.manager';
import { Role } from 'src/infrastructure/data/enums/role.enum';

import { plainToInstance } from 'class-transformer';

import { Wallet } from 'src/infrastructure/entities/wallet/wallet.entity';
import { School } from 'src/infrastructure/entities/school/school.entity';
import { City } from 'src/infrastructure/entities/school/city.entity';
import { Grade } from 'src/infrastructure/entities/school/grade.entity';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { DayHours } from 'src/infrastructure/entities/school/day-hours';
import { where } from 'sequelize';
@Injectable()
export class RegisterUserTransaction extends BaseTransaction<
  RegisterRequest,
  User
> {
  constructor(
    dataSource: DataSource,
    @Inject(ConfigService) private readonly _config: ConfigService,
    @Inject(StorageManager) private readonly storageManager: StorageManager,
    @Inject(ImageManager) private readonly imageManager: ImageManager,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    super(dataSource);
  }

  // the important thing here is to use the manager that we've created in the base class
  protected async execute(
    req: RegisterRequest,

    context: EntityManager,
  ): Promise<User> {
    try {
      // upload avatar
      const admin_id = this.request?.user?.id
      const user = new User(req);
      // upload avatar
      if (req.avatarFile) {
        // resize image to 300x300
        const resizedImage = await this.imageManager.resize(req.avatarFile, {
          size: { width: 300, height: 300 },
          options: {
            fit: sharp.fit.cover,
            position: sharp.strategy.entropy,
          },
        });

        // save image
        const path = await this.storageManager.store(
          { buffer: resizedImage, originalname: req.avatarFile.originalname },
          { path: 'avatars' },
        );

        // set avatar path
        user.avatar = path;
      }
      // encrypt password
      const randomPassword = req.password || randStr(8);
      user.password = await bcrypt.hash(
        randomPassword + this._config.get('app.key'),
        10,
      );
      
      user.username = user?.phone??user?.email;
     if(req?.city_id){
       const city = await context.findOneBy(City, { id: req.city_id });
       if (!city) throw new BadRequestException('message.city_not_found');
       user.city = city;
     }
      
      // set user role
      user.roles = [req.role];
      // save user
      const savedUser = await context.save(User, user);

    
      
      // create driver setting if user is a driver
      if(req.role==Role.SUPERVISOR){
       
        if(!admin_id) throw new BadRequestException('must be admin');
      }
      if (req.role === Role.School) {
        if(!admin_id) throw new BadRequestException('must be admin');
        const count = await context
          .createQueryBuilder(School, 'school')
          .where('school.city_id = :city_id', { city_id: req.city_id })
          .withDeleted()
          .getCount();

        const city = await context.findOneBy(City, { id: req.city_id });
        if (!city) throw new BadRequestException('message.city_not_found');
        const weekdays = [
          { en: "Sunday", ar: "الأحد" },
          { en: "Monday", ar: "الاثنين" },
          { en: "Tuesday", ar: "الثلاثاء" },
          { en: "Wednesday", ar: "الأربعاء" },
          { en: "Thursday", ar: "الخميس" },
          { en: "Friday", ar: "الجمعة" },
          { en: "Saturday", ar: "السبت" },
        
        ];
        
       
        

      
        const school = await context.save(
          School,
          new School({
            name: savedUser.name,
            avatar: savedUser.avatar,
            city_id: city.id,
            city_code: generateFormattedNumber(city.code, count, 4),
            academic_stage:req.academic_stage,
         
          }),
        );
     
        const working_days= weekdays.map((day) => {
          return new DayHours({
            name_ar: day.ar,
            name_en: day.en,
            start_time: '08:00',
            end_time: '14:00',
            order_by: weekdays.indexOf(day),
            school_id:school.id
          })
        })
        
        await context.save(working_days)
        savedUser.school = school;
        const admin = await context.findOne(User,{where:{id:admin_id},relations:{school_users:true}})
        admin.school_users.push(savedUser);

        await context.save(savedUser);
        await context.save(admin);
        
      }
      if(req.role==Role.SECURITY){

        // const classes=await context.find(Grade,{where:{id:In(req.grades_ids)}})
        savedUser.school_id=req.school_id
        // savedUser.grades=classes
      }

      // return user
      return savedUser;
    } catch (error) {
      throw new BadRequestException(
        this._config.get('app.env') !== 'prod'
          ? error
          : 'message.register_failed',
      );
    }
  }
}

function generateFormattedNumber(prefix, number, numDigits) {
  const formattedValue = `${prefix}${number.toString().padStart(numDigits, '0')}`;
  return formattedValue;
}


