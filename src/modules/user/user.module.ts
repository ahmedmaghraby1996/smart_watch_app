import { UserService } from './user.service';
import { Module } from '@nestjs/common';
import { Global } from '@nestjs/common/decorators';
import { UserController } from './user.controller';

@Global()
@Module({
    imports: [],
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService]
})
export class UserModule { }
