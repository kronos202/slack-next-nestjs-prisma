import { HttpMethod } from '@prisma/client';

export interface Permission {
  method: HttpMethod; // 'GET', 'POST', etc.
  path: string; // '/users', '/users/:id', etc.
}
