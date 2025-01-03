import { Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
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

@Injectable({ scope: Scope.REQUEST })
export class UserService extends BaseService<User> {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(School) private readonly schoolRepo: Repository<School>,
    @Inject(REQUEST) private readonly request: Request,
    @Inject(ImageManager) private readonly imageManager: ImageManager,
    @Inject(StorageManager) private readonly storageManager: StorageManager,
    @Inject(ConfigService) private readonly _config: ConfigService,
    
  ) {
    super(userRepo);
  }

  async deleteUser(id: string) {
    const user = await this._repo.findOne({ where: { id: id } ,relations:{school:true}});
    if (!user) throw new NotFoundException('user not found');
    user.username = 'deleted_' + user.username+"_"+randNum(4);
    await this.update(user);
    if(user.roles[0] == Role.School) await this.schoolRepo.softRemove(user.school);
    return await this.userRepo.softRemove(user);
  }
  async updateProfile(id,req: UpdateProfileRequest) {
    const user = plainToInstance(
      User,
      { ...req, id: id?? this.request.user.id },
      {},
    );
    // if(req.city_id){user.school.city_id = req.city_id;}
    if(req.password && this.request.user.roles[0] == Role.ADMIN)  user.password = await bcrypt.hash(req.password + this._config.get('app.key'), 10);
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
    await this.userRepo.save( user);

    return await this.userRepo.findOne( {
      where: { id: user.id },
    });
  }
}
