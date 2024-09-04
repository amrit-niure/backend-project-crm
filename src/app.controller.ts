import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtGuard } from './guards/jwt.guard';
import { Role } from '@prisma/client';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';

@Controller()
export class AppController {
  constructor() {}

  @Roles(Role.USER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtGuard)
  @Get()
  getHello() {
    return { status: 'running' };
  }
}
