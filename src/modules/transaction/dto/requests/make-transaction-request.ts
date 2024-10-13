import { TransactionTypes } from "src/infrastructure/data/enums/transaction-types";

export class MakeTransactionRequest {
  amount: number;
  type: TransactionTypes;
  order_id: string;
  user_id: string;
  receiver_id: string;

  constructor(partial?: Partial<MakeTransactionRequest>) {
    Object.assign(this, partial);
  }
}
