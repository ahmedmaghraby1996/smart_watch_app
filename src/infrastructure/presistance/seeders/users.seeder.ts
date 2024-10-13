import { Injectable } from '@nestjs/common';
import { Seeder, DataFactory } from 'nestjs-seeder';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { Gender } from 'src/infrastructure/data/enums/gender.enum';

@Injectable()
export class UsersSeeder implements Seeder {
  constructor(
    @InjectRepository(User) private readonly user: Repository<User>,
    private readonly configService: ConfigService,
  ) { }

  async seed(): Promise<any> {
    // Generate 10 users.
    const users = DataFactory.createForClass(User).generate(10);
    const password = await bcrypt.hash(
      'secret' + this.configService.get('app.key'),
      bcrypt.genSaltSync(10),
    );

    // create super admin
    const superAdmin = new User({
      name: 'Super Admin',
      account: '00000000',
      username: 'superadmin',
      password,
      email: 'super@app.com',
      email_verified_at: new Date(),
      phone: '+966500000000',
      phone_verified_at: new Date(),
      avatar: 'https://i.pravatar.cc/150?img=1',
      roles: [Role.ADMIN, Role.SUPERADMIN],
      gender: null,
    });

    // create client
    const client = new User({
      id: 'client',
    name: 'John Doe',
      account: '00000001',
      username: '+966555554444',
      phone: '+966555554444',
      phone_verified_at: new Date(),
      avatar: 'https://i.pravatar.cc/150?img=1',
      roles: [Role.PARENT],
      gender: Gender.MALE,
    });

    // create client reciever
    const client_ = new User({
      id: 'client_',
      name: 'Jack Row',
      account: '00000002',
      username: '+966555553333',
      phone: '+966555553333',
      phone_verified_at: new Date(),
      avatar: 'https://i.pravatar.cc/150?img=2',
      roles: [Role.PARENT],
      gender: Gender.MALE,
    });

    // create driver reciever


    users[0] = superAdmin as any;
    users[1] = client as any;
    users[2] = client_ as any;


    // Insert into the database with relations.
    return this.user.save(users);
  }

  async drop(): Promise<any> {
    return this.user.delete({});
  }
}
