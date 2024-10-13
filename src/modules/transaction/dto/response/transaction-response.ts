import { Expose, Transform } from "class-transformer"
import { TransactionTypes } from "src/infrastructure/data/enums/transaction-types"
import { User } from "src/infrastructure/entities/user/user.entity"

export class TransactionResponse {
    @Expose()
    id: string
    @Expose()
    amount: number
    @Expose()
    type: TransactionTypes
    @Expose()
    
    created_at: Date

    @Expose()
    @Transform(( receiver ) => {
   if(receiver.value==null) return null
        return {id:  receiver.value.id, name:  receiver.value.first_name + ' ' +  receiver.value.last_name}
    })

    receiver: User

    @Expose()
    @Transform(( user ) => {
      
        return {id:  user.value.id, name:  user.value.first_name + ' ' +  user.value.last_name}
    })
    user: User
}