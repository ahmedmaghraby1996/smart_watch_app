import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/core/base/service/service.base';
import { IMEI_entity } from 'src/infrastructure/entities/watch-user/IMEI.entity';
import { WatchUser } from 'src/infrastructure/entities/watch-user/watch-user.entity';
import { Repository } from 'typeorm/repository/Repository';
import {
  AddWatchUserRequest,
  EditWatchUserRequest,
} from './dto/requests/add-watch-user.request';
import { FileService } from '../file/file.service';
import { plainToInstance } from 'class-transformer';
import { Request } from 'express';
import { WatchRequest } from 'src/infrastructure/entities/watch-user/watch-request.entity';
import { ConfirmRequest } from './dto/requests/confirm-request';
import { RequestStatus } from 'src/infrastructure/data/enums/reservation-status.eum';
import { School } from 'src/infrastructure/entities/school/school.entity';
import { ILike, In } from 'typeorm';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { WatchGateway } from 'src/integration/gateways/watch.gateway';
import { WatchRequestResponse } from './dto/response/watch-request.response';
import { NotificationService } from '../notification/services/notification.service';
import { NotificationEntity } from 'src/infrastructure/entities/notification/notification.entity';
import { SendToUsersNotificationRequest } from '../notification/dto/requests/send-to-users-notification.request';
import { Role } from 'src/infrastructure/data/enums/role.enum';

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
    public watchGateway: WatchGateway,
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
        watch_user: { parent: true, drivers: true, school: true },
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
      throw new BadRequestException('message.IMEI_already_exist');

    const avatar = await this.file_serivce.upload(req.avatarFile, 'avatars');
    delete req.avatarFile;
    const watchUser = plainToInstance(WatchUser, {
      ...req,
      avatar,
      parent_id: this.request.user.id,
    });
    const driver_ids = req.driver_ids.split(',');
    watchUser.IMEI = watch;
    const drivers = await this.user_repo.find({
      where: { id: In(driver_ids) },
    });
    watchUser.drivers = drivers;
    await this._repo.save(watchUser);
    return watchUser;
  }

  async getWatchUsers() {
    return await this._repo.find({
      where: [
        { parent_id: this.request.user.id },
        { drivers: { id: this.request.user.id } },
      ],
      relations: { parent: true, drivers: true, school: true },
    });
  }

  async getSchoolWatchUsers() {
    return await this._repo.find({
      where: { school_id: this.request.user.school_id },
      relations: { parent: true, drivers: true, school: true },
    });
  }

  async confirmRequest(req: ConfirmRequest) {
    const watch_request = await this.watchRequest_repo.findOne({
      where: { id: req.request_id },
      relations: { watch_user: true },
    });

    // if (!request) throw new BadRequestException('invalid code');
    watch_request.status = RequestStatus.COMPLETED;
    await this.watchRequest_repo.save(watch_request);
    if (this.request.user.id != watch_request.watch_user.parent_id) {
      await this.notification_service.sendToUsers(
        new SendToUsersNotificationRequest({
          message_ar: 'message.request_accepted_ar',
          message_en: 'message.request_accepted_en',
          title_ar: 'message.request_accepted_ar',
          title_en: 'message.request_accepted_en',
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
    });
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
      //generate random code 6 digit

      request.code = Math.floor(100000 + Math.random() * 900000);
      console.log(request);
      await this.watchRequest_repo.save(request);
    }

    const requestResposne = plainToInstance(
      WatchRequestResponse,
      await this.getSingleRequest(request.id),
    );
    const security = await this.user_repo.find({
      where: { school_id: watch.school_id },
    });
    await this.notification_service.sendToUsers(
      new SendToUsersNotificationRequest({
        message_ar: 'message.request_sent_ar',
        message_en: 'message.request_sent_en',
        title_ar: 'message.request_sent_ar',
        title_en: 'message.request_sent_en',
        users_id: security.map((user) => user.id),
      }),
    );
    this.watchGateway.server.emit(
      `new-request-${requestResposne.watch_user.school.id}`,
      requestResposne,
    );
    return request;
  }
  async getWatchRequests() {
    return await this.watchRequest_repo.find({
      where: [
        { watch_user: { parent_id: this.request.user.id } },
        { watch_user: { drivers: { id: this.request.user.id } } },
      ],
      relations: {
        watch_user: { parent: true, drivers: true },
      },
    });
  }

  async getSchoolWatchRequests() {
    return await this.watchRequest_repo.find({
      where: [{ watch_user: { school_id: this.request.user.school_id } }],
      relations: {
        watch_user: { parent: true, drivers: true },
      },
    });
  }

  async getSchools(name: string) {
    name == null ? (name = '') : name;
    return await this.school_repo.find({
      where: { name: ILike(`%${name}%`) },
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
      if(!school) throw new BadRequestException('school not found');
      watch_user.school = school;
    }
    if(request.IMEI){
    const isValidIMEI =  await this.checkWatch(request.IMEI);
    if(!isValidIMEI) throw new BadRequestException('IMEI not valid');
    const IMEI = await this.IMEI_repo.findOne({
      where: { IMEI: request.IMEI },
    })
    watch_user.IMEI = IMEI;
    }
    if(request.phone){
      watch_user.phone = request.phone;
    }
    if(request.name){
      watch_user.name = request.name;
    }
    if(request.gender){
      watch_user.gender = request.gender;
    }
    if(request.birth_date){
      watch_user.birth_date = request.birth_date;
    }

    if (request.driver_ids?.length > 0) {
      const drivers = await this.user_repo.find({
        where: { id: In(request.driver_ids.split(',')) },
      });
      watch_user.drivers = drivers;
    }

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
      where: { id:request.id},
    });
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
