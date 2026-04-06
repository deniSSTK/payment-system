import type { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import type { PaginatedResponse } from '../../../common/interfaces/paginated-response.interface';
import type { TransactionPaginationDto } from '../dto/transaction-pagination.dto';
import type { TransactionResponseDto } from '../dto/transaction-response.dto';
import type { TransferFundsDto } from '../dto/transfer-funds.dto';

export const TRANSACTIONS_SERVICE = Symbol('TRANSACTIONS_SERVICE');

export interface ITransactionsService {
  transfer(currentUser: JwtPayload, dto: TransferFundsDto): Promise<TransactionResponseDto>;
  findAll(dto: TransactionPaginationDto): Promise<PaginatedResponse<TransactionResponseDto>>;
  cancel(currentUser: JwtPayload, transactionId: string): Promise<TransactionResponseDto>;
}
