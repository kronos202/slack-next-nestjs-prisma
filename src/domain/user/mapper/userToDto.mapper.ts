import { User } from '@prisma/client';
import { UserResponseDto } from '../dto/user-response.dto';

export function mapUserToDto(user: User): UserResponseDto {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    avatar: user.avatar,
  };
}
