import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 'cm51dalmm0000ukuwacx7w546' })
  id: string;

  @ApiProperty({ example: 'kronosss2002@gmail.com' })
  email: string;

  @ApiProperty({ example: 'Minh' })
  firstName: string;

  @ApiProperty({ example: 'Nguyen' })
  lastName: string;

  @ApiProperty({ example: 'testuser' })
  username: string;

  @ApiProperty({ example: 'https://api.realworld.io/images/smiley-cyrus.jpeg' })
  avatar: string;
}
