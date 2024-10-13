import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from 'src/infrastructure/entities/wallet/transaction.entity';
import { Wallet } from 'src/infrastructure/entities/wallet/wallet.entity';
import { Repository } from 'typeorm';
import { MakeTransactionRequest } from './dto/requests/make-transaction-request';
import { plainToInstance } from 'class-transformer';
import { BaseUserService } from 'src/core/base/service/user-service.base';
import { Request } from 'express';
import { REQUEST } from '@nestjs/core';

@Injectable()
export class TransactionService extends BaseUserService<Transaction> {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Wallet) private walletRepository: Repository<Wallet>,
    @Inject(REQUEST) request: Request,
  ) {
    super(transactionRepository, request);
  }

  async makeTransaction(req: MakeTransactionRequest) {
    const user_wallet = await this.walletRepository.findOneBy({
      user_id: req.user_id,
    });
    req.amount= Number(req.amount)

    user_wallet.balance = user_wallet.balance - req.amount;
    user_wallet.balance= Number(user_wallet.balance)
    const receiver__wallet = await this.walletRepository.findOneBy({
      user_id: req.receiver_id,
    });
    receiver__wallet.balance= Number(receiver__wallet.balance)
    receiver__wallet.balance = receiver__wallet.balance + req.amount;
    const transaction = plainToInstance(Transaction, {
      ...req,
    });

    

    await this.transactionRepository.save(transaction);
    await this.walletRepository.save(receiver__wallet);
    await this.walletRepository.save(user_wallet);
    return transaction;
  }
  async checkBalance(user_id: string, amount: number) {
    const wallet = await this.walletRepository.findOneBy({
      user_id: user_id,
    });
    if ( Number(wallet.balance) < Number(amount)) {
      return false;
    }
    return true;
  }

  async getWallet() {
    const wallet = await this.walletRepository.findOneBy({
      user_id: this.currentUser.id,
    });
    return wallet;
  }
}
