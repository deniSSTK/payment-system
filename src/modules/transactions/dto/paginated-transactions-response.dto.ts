import { ApiProperty } from '@nestjs/swagger';
import { PaginatedMetaDto } from '../../../common/dto/paginated-meta.dto';
import { TransactionResponseDto } from './transaction-response.dto';

export class PaginatedTransactionsResponseDto {
  @ApiProperty({ type: () => [TransactionResponseDto] })
  items!: TransactionResponseDto[];

  @ApiProperty({ type: PaginatedMetaDto })
  meta!: PaginatedMetaDto;
}
