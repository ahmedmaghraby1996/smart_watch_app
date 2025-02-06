import { BadRequestException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { Repository } from 'typeorm';
import { BaseService } from 'src/core/base/service/service.base';
import { randNum } from 'src/core/helpers/cast.helper';
import { plainToInstance } from 'class-transformer';
import * as sharp from 'sharp';
import { UpdateProfileRequest } from './dto/update-profile-request';
import { ImageManager } from 'src/integration/sharp/image.manager';
import { StorageManager } from 'src/integration/storage/storage.manager';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import * as bcrypt from 'bcrypt';
import { School } from 'src/infrastructure/entities/school/school.entity';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { ConfigService } from '@nestjs/config';
import { UpdateSchoolWorkHoursRequest } from './dto/request/updateSchoolWorkHours';
import { DayHours } from 'src/infrastructure/entities/school/day-hours';

@Injectable({ scope: Scope.REQUEST })
export class UserService extends BaseService<User> {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(School) private readonly schoolRepo: Repository<School>,
    @Inject(REQUEST) private readonly request: Request,
    @Inject(ImageManager) private readonly imageManager: ImageManager,
    @Inject(StorageManager) private readonly storageManager: StorageManager,
    @Inject(ConfigService) private readonly _config: ConfigService,
    @InjectRepository(DayHours) private readonly dayHoursRepo: Repository<DayHours>,
  ) {
    super(userRepo);
  }

  async deleteUser(id: string) {
    const user = await this._repo.findOne({
      where: { id: id },
      relations: { school: true ,},
    });
    if (!user) throw new NotFoundException('user not found');
    user.username = 'deleted_' + user.username + '_' + randNum(4);
    await this.update(user);
    if (user.roles[0] == Role.School){
      const watchUsers=await this.schoolRepo.find({where:{watchUsers:{school_id:user.school_id}}})
      if(watchUsers.length>0)
        throw new BadRequestException('school has watch users');
      await this.schoolRepo.softRemove(user.school);}
    return await this.userRepo.softRemove(user);
  }
  async updateProfile(id, req: UpdateProfileRequest) {
    const user = plainToInstance(
      User,
      { ...req, id: id ?? this.request.user.id },
      {},
    );
    // if(req.city_id){user.school.city_id = req.city_id;}
    if (
      req.password &&
      (this.request.user.roles[0] == Role.ADMIN ||
        this.request.user.roles[0] == Role.School)
    )
      user.password = await bcrypt.hash(
        req.password + this._config.get('app.key'),
        10,
      );
    if (req.avatarFile) {
      const resizedImage = await this.imageManager.resize(req.avatarFile, {
        size: { width: 300, height: 300 },
        options: {
          fit: sharp.fit.cover,
          position: sharp.strategy.entropy,
        },
      });
      const path = await this.storageManager.store(
        { buffer: resizedImage, originalname: req.avatarFile.originalname },
        { path: 'avatars' },
      );
      user.avatar = path;
    }
    await this.userRepo.save(user);

    return await this.userRepo.findOne({
      where: { id: user.id },
    });
  }
  async getUserGrades(id: string) {
    const user = await this._repo.findOne({ where: { id: id },relations:{grades:true} });
    return user.grades;
  }

  async getUserSchools() {
    const user = await this._repo.findOne({ where: { id: this.request.user.id },relations:{school_users:{school:true}} });
    return user.school_users;
  }
  async getSchoolWorkHours() {
    const user = await this._repo.findOne({ where: { id: this.request.user.id },relations:{school:{day_hours:true}} })
    return user.school.day_hours;
  }
  async updateSchoolWorkHours(req: UpdateSchoolWorkHoursRequest) {
    const day_hour=await this.dayHoursRepo.findOne({where:{id:req.id}})
    day_hour.start_time=req.start_time
    day_hour.end_time=req.end_time
    day_hour.is_active=req.is_active
    await this.dayHoursRepo.save(day_hour)
    return day_hour
  }
}
