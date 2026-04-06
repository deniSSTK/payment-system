import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
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
import { TransactionResponseDto } from '../../transactions/dto/transaction-response.dto';
import { DepositFundsDto } from '../dto/deposit-funds.dto';
import { AccountResponseDto } from '../dto/account-response.dto';
import { ACCOUNTS_SERVICE, IAccountsService } from '../interfaces/accounts-service.interface';

@ApiTags('Accounts')
@ApiCookieAuth(ACCESS_TOKEN_COOKIE_AUTH)
@Controller('accounts')
export class AccountsController {
  constructor(
    @Inject(ACCOUNTS_SERVICE)
    private readonly accountsService: IAccountsService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user billing account' })
  @ApiOkResponse({ type: AccountResponseDto })
  async getMyAccount(@CurrentUser() user: JwtPayload): Promise<AccountResponseDto> {
    const account = await this.accountsService.getByUserId(user.sub);
    return AccountResponseDto.fromEntity(account);
  }

  @Post('deposit')
  @Roles(RoleName.CLIENT)
  @ApiOperation({ summary: 'Deposit funds into the current client account' })
  @ApiOkResponse({ type: TransactionResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto, description: 'Invalid deposit amount.' })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
    description: 'Only active clients can deposit into their own account.',
  })
  @ApiNotFoundResponse({ type: ErrorResponseDto, description: 'Account not found.' })
  async deposit(
    @CurrentUser() user: JwtPayload,
    @Body() dto: DepositFundsDto,
  ): Promise<TransactionResponseDto> {
    return this.accountsService.deposit(user.sub, dto);
  }
}
