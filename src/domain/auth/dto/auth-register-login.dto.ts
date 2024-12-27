import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { lowerCaseTransformer } from 'src/utils/transformers/lower-case.transformer';

export class AuthRegisterLoginDto {
  @Transform(lowerCaseTransformer)
  @IsEmail()
  @IsString()
  email: string;

  @MinLength(6)
  @IsOptional()
  @IsString()
  password?: string;

  @MinLength(6)
  @IsOptional()
  @IsString()
  confirmPassword?: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  username: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  firstName: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  lastName: string;
}
