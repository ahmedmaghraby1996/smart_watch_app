import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, EntityManager } from 'typeorm';
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
      if (req.role === Role.SECURITY) user.school_id = req.school_id;
      user.username = user.phone;
      // set user role
      user.roles = [req.role];
      // save user
      const savedUser = await context.save(User, user);

      // create driver setting if user is a driver
      if (req.role === Role.School) {
        const count = await context
          .createQueryBuilder(School, 'school')
          .where('school.city_id = :city_id', { city_id: req.city_id })
          .withDeleted()
          .getCount();

        const city = await context.findOneBy(City, { id: req.city_id });
        if (!city) throw new BadRequestException('message.city_not_found');
        const school = await context.save(
          School,
          new School({
            name: savedUser.name,
            avatar: savedUser.avatar,
            city_id: city.id,
            city_code: generateFormattedNumber(city.code, count, 4),
          }),
        );
        savedUser.school = school;
        await context.save(savedUser);
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


