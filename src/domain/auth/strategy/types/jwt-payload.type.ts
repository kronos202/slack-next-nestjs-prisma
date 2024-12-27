import { Session, User } from '@prisma/client';

export type JwtPayloadType = Pick<User, 'id'> & {
  sessionId: Session['id'];
  roles: string[];
  permissions: string[];
  iat: number;
  exp: number;
};
