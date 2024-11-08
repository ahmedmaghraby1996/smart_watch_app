import { Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { Repository } from 'typeorm';
import { BaseService } from 'src/core/base/service/service.base';
import { randNum } from 'src/core/helpers/cast.helper';
import { plainToInstance } from 'class-transformer';
import sharp from 'sharp';
import { UpdateProfileRequest } from './dto/update-profile-request';
import { ImageManager } from 'src/integration/sharp/image.manager';
import { StorageManager } from 'src/integration/storage/storage.manager';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class UserService extends BaseService<User> {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @Inject(REQUEST) private readonly request: Request,
    @Inject(ImageManager) private readonly imageManager: ImageManager,
    @Inject(StorageManager) private readonly storageManager: StorageManager,
  ) {
    super(userRepo);
  }

  async deleteUser(id: string) {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException('user not found');
    user.username = 'deleted_' + user.username+"_"+randNum(4);
    await this.update(user);
    return await this.userRepo.softRemove(user);
  }
  async updateProfile(id,request: UpdateProfileRequest) {
    const user = plainToInstance(
      User,
      { ...request, id: id?? this.request.user.id },
      {},
    );

    if (request.avatarFile) {
      const resizedImage = await this.imageManager.resize(request.avatarFile, {
        size: { width: 300, height: 300 },
        options: {
          fit: sharp.fit.cover,
          position: sharp.strategy.entropy,
        },
      });
      const path = await this.storageManager.store(
        { buffer: resizedImage, originalname: request.avatarFile.originalname },
        { path: 'avatars' },
      );
      user.avatar = path;
    }
    await this.userRepo.save( user);

    return await this.userRepo.findOne( {
      where: { id: this.request.user.id },
    });
  }
}
