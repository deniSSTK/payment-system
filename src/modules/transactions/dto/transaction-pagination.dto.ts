import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { TransactionStatus } from '../../../common/constants/transaction-status.enum';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class TransactionPaginationDto extends PaginationDto {
  @ApiPropertyOptional({ enum: TransactionStatus })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;
}
