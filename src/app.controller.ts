import { Controller, Get } from '@nestjs/common';

import { Role } from '@prisma/client';
import { Roles } from './decorators/roles.decorator';

@Controller()
export class AppController {
  constructor() {}

  @Roles(Role.ADMIN)
  @Get()
  getHello() {
    return { status: 'running' };
  }
}
