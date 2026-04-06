import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ example: '2026-04-05T19:15:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: '/api/transactions/123/cancel' })
  path!: string;

  @ApiProperty({ example: 'POST' })
  method!: string;

  @ApiProperty({ example: 'Bad Request' })
  error!: string;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: 'Insufficient balance.',
  })
  message!: string | string[];

  @ApiProperty({
    additionalProperties: true,
    example: {
      message: 'Insufficient balance.',
      error: 'Bad Request',
      statusCode: 400,
    },
  })
  details!: Record<string, unknown>;
}
