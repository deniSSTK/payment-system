import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class DepositFundsDto {
  @ApiProperty({
    example: '150.75',
    description: 'Positive amount with up to two decimal places.',
  })
  @IsString()
  @Matches(/^(0|[1-9]\d*)(\.\d{1,2})?$/, {
    message: 'Amount must be a positive monetary value with up to 2 decimal places.',
  })
  amount!: string;

  @ApiPropertyOptional({ example: 'Top up via bank transfer' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  description?: string;
}
