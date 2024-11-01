import { Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/core/base/service/service.base';
import { WatchRequest } from 'src/infrastructure/entities/watch-user/watch-request.entity';
import { Repository } from 'typeorm';

export class WatchRequestService extends BaseService<WatchRequest> {
  constructor(
    @InjectRepository(WatchRequest)
    private readonly repo: Repository<WatchRequest>,
  ) {
    super(repo);
  }
}
