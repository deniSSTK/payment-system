import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ACCESS_TOKEN_COOKIE_AUTH } from '../../../common/constants/auth.constants';
import { RoleName } from '../../../common/constants/role.enum';
import { ErrorResponseDto } from '../../../common/dto/error-response.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { PaginatedResponse } from '../../../common/interfaces/paginated-response.interface';
import { PaginatedTransactionsResponseDto } from '../dto/paginated-transactions-response.dto';
import { TransactionPaginationDto } from '../dto/transaction-pagination.dto';
import { TransactionResponseDto } from '../dto/transaction-response.dto';
import { TransferFundsDto } from '../dto/transfer-funds.dto';
import {
  ITransactionsService,
  TRANSACTIONS_SERVICE,
} from '../interfaces/transactions-service.interface';

@ApiTags('Transactions')
@ApiCookieAuth(ACCESS_TOKEN_COOKIE_AUTH)
@Controller('transactions')
export class TransactionsController {
  constructor(
    @Inject(TRANSACTIONS_SERVICE)
    private readonly transactionsService: ITransactionsService,
  ) {}

  @Post('transfer')
  @Roles(RoleName.ADMIN, RoleName.CLIENT)
  @ApiOperation({ summary: 'Transfer funds between user billing accounts' })
  @ApiOkResponse({ type: TransactionResponseDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Invalid transfer amount or transfer cannot be completed.',
  })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
    description: 'The current user cannot perform this transfer.',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'The source or destination account was not found.',
  })
  async transfer(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: TransferFundsDto,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.transfer(currentUser, dto);
  }

  @Get()
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Get all transactions with reusable pagination' })
  @ApiOkResponse({ type: PaginatedTransactionsResponseDto })
  async findAll(
    @Query() dto: TransactionPaginationDto,
  ): Promise<PaginatedResponse<TransactionResponseDto>> {
    return this.transactionsService.findAll(dto);
  }

  @Post(':id/cancel')
  @Roles(RoleName.ADMIN, RoleName.CLIENT)
  @ApiOperation({
    summary: 'Cancel a transaction and reverse funds when required',
    description:
      'Admins can cancel any transaction. Clients can cancel their transactions within a 5-minute window if funds are available.',
  })
  @ApiOkResponse({ type: TransactionResponseDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description:
      'Transaction cannot be canceled or reversed, including cases with insufficient funds for reversal.',
  })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
    description: 'The current user is not allowed to cancel this transaction.',
  })
  @ApiNotFoundResponse({ type: ErrorResponseDto, description: 'Transaction not found.' })
  async cancel(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.cancel(currentUser, id);
  }
}
