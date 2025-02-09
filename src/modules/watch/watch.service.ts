import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/core/base/service/service.base';
import { IMEI_entity } from 'src/infrastructure/entities/watch-user/IMEI.entity';
import { v4 as uuidv4 } from 'uuid';
import { WatchUser } from 'src/infrastructure/entities/watch-user/watch-user.entity';
import { Repository } from 'typeorm/repository/Repository';
import {
  AddWatchUserRequest,
  EditWatchUserRequest,
} from './dto/requests/add-watch-user.request';
import { FileService } from '../file/file.service';
import { plainToClass, plainToInstance } from 'class-transformer';
import { Request } from 'express';
import { WatchRequest } from 'src/infrastructure/entities/watch-user/watch-request.entity';
import { ConfirmRequest } from './dto/requests/confirm-request';
import { RequestStatus } from 'src/infrastructure/data/enums/reservation-status.eum';
import { StorageManager } from 'src/integration/storage/storage.manager';
import { School } from 'src/infrastructure/entities/school/school.entity';
import { ILike, In, MoreThan } from 'typeorm';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { WatchGateway } from 'src/integration/gateways/watch.gateway';
import { WatchRequestResponse } from './dto/response/watch-request.response';
import { NotificationService } from '../notification/services/notification.service';
import { NotificationEntity } from 'src/infrastructure/entities/notification/notification.entity';
import { SendToUsersNotificationRequest } from '../notification/dto/requests/send-to-users-notification.request';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { validate } from 'class-validator';
import { UUIDV4 } from 'sequelize';
import { Grade } from 'src/infrastructure/entities/school/grade.entity';
import { I18nResponse } from 'src/core/helpers/i18n.helper';

@Injectable()
export class WatchService extends BaseService<WatchUser> {
  constructor(
    @InjectRepository(WatchUser)
    repo: Repository<WatchUser>,
    public file_serivce: FileService,
    @InjectRepository(IMEI_entity) public IMEI_repo: Repository<IMEI_entity>,
    @InjectRepository(WatchRequest)
    public watchRequest_repo: Repository<WatchRequest>,
    @InjectRepository(School) public school_repo: Repository<School>,
    @Inject(REQUEST) private readonly request: Request,
    private readonly notification_service: NotificationService,
    @InjectRepository(User) public user_repo: Repository<User>,
    @InjectRepository(Grade) public grade_repo: Repository<Grade>,
    public watchGateway: WatchGateway,
    @Inject(I18nResponse) private readonly _i18nResponse: I18nResponse,
    @Inject(StorageManager) private readonly storageManager: StorageManager,
  ) {
    super(repo);
  }

  async checkWatch(IMEI: string) {
    const watch = await this.IMEI_repo.findOne({
      where: { IMEI: IMEI },
      relations: { watch_user: true },
    });
    if (!watch || watch.watch_user) return false;
    return true;
  }
  async getSingleRequest(id: string) {
    return await this.watchRequest_repo.findOne({
      where: { id },
      relations: {
        user: true,
        watch_user: { parent: true, drivers: true, school: true ,grade:true},
      },
      withDeleted: true,
    });
  }

  async addWatchUser(req: AddWatchUserRequest) {
    const watch = await this.IMEI_repo.findOne({
      where: { IMEI: req.IMEI },
      relations: { watch_user: true },
    });
    if (!watch || watch.watch_user)
      throw new BadRequestException('invalid IMEI');

    const avatar =
      req.avatarFile != null
        ? await this.file_serivce.upload(req.avatarFile, 'avatars')
        : null;
    delete req.avatarFile;
    const watchUser = plainToInstance(WatchUser, {
      ...req,
      avatar,
      parent_id: this.request.user.id,
    });
    if (req.driver_ids?.length > 0) {
      const driver_ids = req.driver_ids.split(',');

      const drivers = await this.user_repo.find({
        where: { id: In(driver_ids) },
      });
      watchUser.drivers = drivers;
    }

    watchUser.IMEI = watch;
    await this._repo.save(watchUser);
    return watchUser;
  }

  async getWatchUsers() {
    return await this._repo.find({
      where: [
        { parent_id: this.request.user.id },
        { drivers: { id: this.request.user.id } },
      ],
      relations: { parent: true, drivers: true, school: true, IMEI: true ,grade:true },
      
    });
  }

  async getSchoolWatchUsers() {
    return await this._repo.find({
      where: { school_id: this.request.user.school_id },
      relations: { parent: true, drivers: true, school: true ,grade:true},
    });
  }

  async confirmRequest(req: ConfirmRequest) {
    const watch_request = await this.watchRequest_repo.findOne({
      where: { id: req.request_id },
      relations: { watch_user: true },
      withDeleted:true
    });

    // if (!request) throw new BadRequestException('invalid code');
    watch_request.status = RequestStatus.CONFIRMED;
    await this.watchRequest_repo.save(watch_request);
  
      await this.notification_service.sendToUsers(
        new SendToUsersNotificationRequest({
          message_ar: `${watch_request.number} تم تأكيد الطلب`,
          message_en: `${watch_request.number} request has been confirmed`,
          title_ar: `${watch_request.number} تم تأكيد الطلب`,
          title_en: `${watch_request.number} request has been confirmed`,
          users_id: [watch_request.user_id],
        }),
      );

    
    const requestResposne =  plainToInstance(
      WatchRequestResponse,
    this._i18nResponse.entity(  await this.getSingleRequest(watch_request.id)),
    );

    this.watchGateway.server.emit(`request-confirmed-${watch_request.user_id}`, requestResposne);
    
    
    return watch_request;
  }

  async completeRequest(req: ConfirmRequest) {
    const watch_request = await this.watchRequest_repo.findOne({
      where: { id: req.request_id },
      relations: { watch_user: true },
      withDeleted:true
    });

    // if (!request) throw new BadRequestException('invalid code');
    watch_request.status = RequestStatus.COMPLETED;
    await this.watchRequest_repo.save(watch_request);
    if (this.request.user.id != watch_request.watch_user.parent_id) {
      await this.notification_service.sendToUsers(
        new SendToUsersNotificationRequest({
          message_ar: `${watch_request.number} تم اكمال الطلب`,
          message_en: `${watch_request.number} request has been completed`,
          title_ar: `${watch_request.number} تم اكمال الطلب`,
          title_en: `${watch_request.number} request has been completed`,
          users_id: [watch_request.watch_user.parent_id],
        }),
      );
    }
    return watch_request;
  }
  async makeRequest(id: string) {
    const watch = await this._repo.findOne({
      where: [
        { id: id, parent_id: this.request.user.id },
        { id: id, drivers: { id: this.request.user.id } },
      
      ],
relations:{school:{day_hours:true},},order:{school:{day_hours:{order_by:'ASC'}} }
    });
   

    const now = new Date();
    const ksaNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Riyadh' })); // Convert to KSA Time
    
    const dayOfWeek = ksaNow.getDay();
    const dayHour = watch.school.day_hours[dayOfWeek];
    
    // Parse the start and end time strings into Date objects
    const [startHour, startMinute] = dayHour.start_time.split(':').map(Number);
    const [endHour, endMinute] = dayHour.end_time.split(':').map(Number);
    
    const startTime = new Date(ksaNow);
    startTime.setHours(startHour, startMinute, 0, 0);
    
    const endTime = new Date(ksaNow);
    endTime.setHours(endHour, endMinute, 0, 0);
    
    // Check if current KSA time is within working hours
    const isWithinWorkingHours = ksaNow >= startTime && ksaNow < endTime;
    
    if (!isWithinWorkingHours) {
      throw new BadRequestException('message.not_within_working_hours');
    }
    

    if (!watch) throw new BadRequestException('message.not_found');
    let request = await this.watchRequest_repo.findOne({
      where: { watch_user_id: watch.id, status: RequestStatus.PENDNING },
    });
    if (request != null) {
      request.created_at = new Date();
      await this.watchRequest_repo.save(request);
    } else {
      request = new WatchRequest();
      const count = await this.watchRequest_repo
        .createQueryBuilder('watch_request')
        .where('DATE(watch_request.created_at) = CURDATE()')
        .getCount();
      const number = generateOrderNumber(count);

      request.watch_user_id = watch.id;
      request.number = number;
      request.user_id = this.request.user.id;
      request.school_id = watch.school_id;
      request.grade_id=watch.grade_id
      //generate random code 6 digit

      request.code = Math.floor(100000 + Math.random() * 900000);
      console.log(request);
      await this.watchRequest_repo.save(request);
    }

    const requestResposne =  plainToInstance(
      WatchRequestResponse,
    this._i18nResponse.entity(  await this.getSingleRequest(request.id)),
    );
    const securities= await this.user_repo.find({
      where: { school_id: watch.school_id ,grades:{id:watch.grade_id}},
    }) 
    const school=await this.user_repo.findOne({where:{school_id:watch.school_id,roles:Role.School}})
    securities.push(school)
    await this.notification_service.sendToUsers(
      new SendToUsersNotificationRequest({
        message_ar: `${requestResposne.number} تم تقديم طلب جديد`, 
        message_en: `${requestResposne.number} request has been sent`,
        title_ar: `${requestResposne.number} تم تقديم طلب جديد  `,
        title_en: `${requestResposne.number} request has been sent`,
        users_id: securities.map((user) => user.id),
      }),
    );
    this.watchGateway.server.emit(
      `new-request-${requestResposne.watch_user.school.id}`,
      requestResposne,
    );

    securities.forEach((user) => {
      this.watchGateway.server.emit(
        `new-request-${user.id}`,
        requestResposne,
      )
    })
    return request;
  }
  async getWatchRequests() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return await this.watchRequest_repo.find({
      where: [
        {
          created_at: MoreThan(oneDayAgo),
          watch_user: {
            parent_id: this.request.user.id,
         
          },
        },
        {
          created_at: MoreThan(oneDayAgo),
          watch_user: {
            drivers: { id: this.request.user.id },
         
          },
        },
      ],
      relations: {
        watch_user: { parent: true, drivers: true ,grade:true},
      },
    });
  }

  async getSchoolWatchRequests() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return await this.watchRequest_repo.find({
      where: [
        {   created_at: MoreThan(oneDayAgo),
          watch_user: { school_id: this.request.user.school_id },
        
        },
      ],
      relations: {
        watch_user: { parent: true, drivers: true ,grade:true },
      },
    });
  }

  async getSchools(code: string) {
    code == null ? (code = '') : code;
    return await this.school_repo.find({
      where: { city_code: ILike(`%${code}%`) },
    });
  }

  async editWatchUser(request: EditWatchUserRequest) {
    const watch_user = await this._repo.findOne({
      where: { id: request.id },
    });
    if (!watch_user) throw new BadRequestException('not found');
    if (request.school_id) {
      const school = await this.school_repo.findOne({
        where: { id: request.school_id },
      });
      if (!school) throw new BadRequestException('school not found');
      watch_user.school = school;
    }
    if(request.grade_id){
      const grade = await this.grade_repo.findOne({
        where: { id: request.grade_id },
      })
      if(!grade) throw new BadRequestException('grade not found')
      watch_user.grade = grade
    }
    if (request.IMEI) {
      const IMEI = await this.IMEI_repo.findOne({
        where: [
          { IMEI: request.IMEI, watch_user: null },
          { IMEI: request.IMEI, watch_user: { id: watch_user.id } },
        ],
      });
      if (!IMEI) throw new BadRequestException('IMEI not available');
      watch_user.IMEI = IMEI;
    }
    if (request.phone) {
      watch_user.phone = request.phone;
    }
    if (request.name) {
      watch_user.name = request.name;
    }
    if (request.gender) {
      watch_user.gender = request.gender;
    }
    if (request.birth_date) {
      watch_user.birth_date = request.birth_date;
    }

    if (request.driver_ids?.length > 0) {
      const drivers = await this.user_repo.find({
        where: { id: In(request.driver_ids.split(',')) },
      });
      watch_user.drivers = drivers;
    } else watch_user.drivers = null;

    if (request.avatarFile) {
      const avatar = await this.file_serivce.upload(
        request.avatarFile,
        'avatars',
      );
      await this.file_serivce.delete(watch_user.avatar);
      watch_user.avatar = avatar;
    }

    await this._repo.save(watch_user);

    return await this._repo.findOne({
      where: { id: request.id },
    });
  }

  async importWatches(req: any) {
    const file = await this.storageManager.store(req.file, {
      path: 'product-export',
    });
    const jsonData = await this.file_serivce.importExcel(file);

    // const CreateProductRequest = plainToClass(IMEI_entity, {
    //   products: jsonData,
    // });
    const validationErrors = await validate(jsonData);
    if (validationErrors.length > 0) {
      throw new BadRequestException(JSON.stringify(validationErrors));
    }
    const newWatches = [];
    console.log(jsonData);
    for (let index = 0; index < jsonData.length; index++) {
      const imei =
        typeof jsonData[index]['IMEI'] === 'object'
          ? jsonData[index]['IMEI']?.result
          : jsonData[index]['IMEI'];

      console.log(imei);
      const imeiExists = await this.IMEI_repo.findOne({
        where: { IMEI: imei },
      });
      if (!imeiExists) {
        newWatches.push(new IMEI_entity({ IMEI: imei, id: uuidv4() }));
      }
    }
  
    return await this.IMEI_repo.save(newWatches);
  }
}

export const generateOrderNumber = (count: number) => {
  // number of digits matches ##-**-@@-&&&&, where ## is 100 - the year last 2 digits, ** is 100 - the month, @@ is 100 - the day, &&&& is the number of the order in that day
  const date = new Date();
  const year = date.getFullYear().toString().substr(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  // order number is the count of orders created today + 1 with 4 digits and leading zeros
  const orderNumber = (count + 1).toString().padStart(4, '0');
  return `${100 - parseInt(year)}${100 - parseInt(month)}${
    100 - parseInt(day)
  }${orderNumber}`;
};
