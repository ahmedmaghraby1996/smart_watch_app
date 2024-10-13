import { Module } from '@nestjs/common';
import { WatchController } from './watch.controller';
import { WatchService } from './watch.service';
import { FileService } from '../file/file.service';

@Module({
  controllers: [WatchController],
  providers: [WatchService,FileService],
})
export class WatchModule {}
