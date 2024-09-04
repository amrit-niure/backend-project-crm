import { Role } from '@prisma/client';

export type Currentuser = {
  sub: string;
  name: string;
  email: string;
  role: Role;
};
