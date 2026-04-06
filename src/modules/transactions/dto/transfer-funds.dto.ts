import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';

export class TransferFundsDto {
  @ApiProperty({ example: '7b3d11dc-98b4-4d8a-9e4f-3e79d1f50efb' })
  @IsUUID()
  destinationUserId!: string;

  @ApiProperty({
    example: '150.75',
    description: 'Positive amount with up to two decimal places.',
  })
  @IsString()
  @Matches(/^(0|[1-9]\d*)(\.\d{1,2})?$/, {
    message: 'Amount must be a positive monetary value with up to 2 decimal places.',
  })
  amount!: string;

  @ApiPropertyOptional({ example: 'Invoice #1052' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  description?: string;
}
