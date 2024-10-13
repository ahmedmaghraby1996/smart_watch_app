import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/core/base/service/service.base';
import { IMEI } from 'src/infrastructure/entities/watch-user/IMEI.entity';
import { WatchUser } from 'src/infrastructure/entities/watch-user/watch-user.entity';
import { Repository } from 'typeorm/repository/Repository';
import { AddWatchUserRequest } from './dto/requests/add-watch-user.request';
import { FileService } from '../file/file.service';
import { plainToInstance } from 'class-transformer';
import { Request } from 'express';
import { WatchRequest } from 'src/infrastructure/entities/watch-user/watch-request.entity';

@Injectable()
export class WatchService extends BaseService<WatchUser> {
  constructor(
    @InjectRepository(WatchUser)
    repo: Repository<WatchUser>,
    public file_serivce: FileService,
    @InjectRepository(IMEI) public IMEI_repo: Repository<IMEI>,
    @InjectRepository(WatchRequest)
    public watchRequest_repo: Repository<WatchRequest>,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    super(repo);
  }

  async checkWatch(IMEI: string) {
    const watch = await this.IMEI_repo.findOne({
      where: { IMEI: IMEI },
      relations: ['watchUser'],
    });
    if (!watch || watch.watchUser) return false;
    return true;
  }

  async addWatchUser(req: AddWatchUserRequest) {
    const watch = await this.IMEI_repo.findOne({
      where: { IMEI: req.IMEI },
      relations: ['watchUser'],
    });
    if (!watch || watch.watchUser)
      throw new BadRequestException('message.IMEI_already_exist');

    const avatar = await this.file_serivce.upload(req.avatarFile, 'avatars');
    delete req.avatarFile;
    const watchUser = plainToInstance(WatchUser, {
      ...req,
      avatar,
      parent_id: this.request.user.id,
    });
    watchUser.IMEI = watch;
    await this._repo.save(watchUser);
    return watchUser;
  }

  async getWatchUsers() {
    return await this._repo.find({
      where: [
        { parent_id: this.request.user.id },
        { driver_id: this.request.user.id },
      ],
    });
  }

  async getSchoolWatchUsers() {
    return await this._repo.find({
      where: { school_id: this.request.user.school_id },
    });
  }

  async makeRequest(id: string) {
    const watch = await this._repo.findOne({
      where: { id: id },
    });
    if (!watch) throw new BadRequestException('message.not_found');

    const request = new WatchRequest();
    request.watch_user_id = watch.id;
    //generate random code 6 digit

    request.code = Math.floor(100000 + Math.random() * 900000);
    await this.watchRequest_repo.save(request);
    return request;
  }
  async getWatchRequests() {
    return await this.watchRequest_repo.find({
      where: [
        { watchUser: { parent_id: this.request.user.id } },
        { watchUser: { driver_id: this.request.user.id } },
      ],
      relations: {
        watchUser: { parent: true, driver: true },
      },
    });
  }

  async getSchoolWatchRequests() {
    return await this.watchRequest_repo.find({
      where: [{ watchUser: { school_id: this.request.user.school_id } }],
      relations: {
        watchUser: { parent: true, driver: true },
      },
    });
  }
}
