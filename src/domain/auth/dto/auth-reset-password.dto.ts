import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AuthResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'passwordexample123',
    description: 'new password',
  })
  password: string;

  @IsString()
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtNTFkYWxtbTAwMDB1a3V3YWN4N3c1NDYiLCJyb2xlcyI6WyJ1c2VyIl0sInNlc3Npb25JZCI6MzgsInBlcm1pc3Npb25zIjpbeyJtZXRob2QiOiJHRVQiLCJwYXRoIjoiL3VzZXJzIn0seyJtZXRob2QiOiJQT1NUIiwicGF0aCI6Ii9hdXRoIn1dLCJpYXQiOjE3MzUwMjc3OTksImV4cCI6MTczNTYzMjU5OX0.kjcduBvILIv-r0AYJ-gHkGKW_nMh_IJYIwwH4SQQ3Ns',
    description: 'token hash body',
  })
  @IsNotEmpty()
  hash: string;
}