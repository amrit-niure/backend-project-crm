import { Controller, Get, Req, Request, SetMetadata, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtGuard } from './guards/jwt.guard';
import { Role } from '@prisma/client';
import { Roles } from './decorators/roles.decorator';


@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Roles(Role.ADMIN)
  @Get()
  getHello() {
    return { status: 'running' }
  }

}
