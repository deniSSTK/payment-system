import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class SessionResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;
}
