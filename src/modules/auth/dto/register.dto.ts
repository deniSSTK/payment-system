import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'client@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'Password123!',
    description:
      'At least 8 characters with one uppercase letter, one lowercase letter and one number.',
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password must include uppercase, lowercase and numeric characters.',
  })
  password!: string;
}
