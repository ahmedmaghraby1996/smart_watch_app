import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { PaginatedRequest } from 'src/core/base/requests/paginated.request';
import { PaginatedResponse } from 'src/core/base/responses/paginated.response';
import { ActionResponse } from 'src/core/base/responses/action.response';
import {
  applyQueryFilters,
  applyQueryIncludes,
  applyQuerySort,
} from 'src/core/helpers/service-related.helper';
import { ApiTags, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { plainToInstance } from 'class-transformer';
import { TransactionResponse } from './dto/response/transaction-response';

@ApiTags('Transaction')
@ApiHeader({
  name: 'Accept-Language',
  required: false,
  description: 'Language header: en, ar',
})
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  async getTransactions(@Query() query: PaginatedRequest) {
    applyQueryIncludes(query, 'user');
    applyQueryIncludes(query, 'receiver');
    applyQuerySort(query, 'created_at=desc');
    applyQueryFilters(
      query,
      `user_id=${this.transactionService.currentUser.id}`,
      [`receiver_id=${this.transactionService.currentUser.id}`],
    );

    const transaction = await this.transactionService.findAll(query);
    const result = transaction.map((transaction) =>
      plainToInstance(TransactionResponse, {
        ...transaction,
        payee:
          this.transactionService.currentUser.id == transaction.user_id
            ? true:false
            
      }),
    );

    if (query.page && query.limit) {
      const total = await this.transactionService.count(query);
      return new PaginatedResponse(result, { meta: { total, ...query } });
    } else {
      return new ActionResponse(result);
    }
  }

  @Get('wallet')
  async getWallet() {
    return new ActionResponse(await this.transactionService.getWallet());
  }
}
