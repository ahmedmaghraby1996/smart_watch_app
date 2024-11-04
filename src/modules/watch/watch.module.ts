import { Module } from '@nestjs/common';
import { WatchController } from './watch.controller';
import { WatchService } from './watch.service';
import { FileService } from '../file/file.service';
import { WatchRequest } from 'src/infrastructure/entities/watch-user/watch-request.entity';
import { IMEIService, WatchRequestService } from './watch-request.service';

@Module({
  controllers: [WatchController],
  providers: [WatchService,FileService,WatchRequestService,IMEIService],
})
export class WatchModule {}
