import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard, Roles, RolesGuard } from '../auth/security';
@ApiTags('Пользователи') @ApiBearerAuth() @Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private prisma: PrismaService) {}
  @Get() @Roles('ADMIN') list() { return this.prisma.user.findMany({select:{id:true,name:true,email:true,role:true,createdAt:true},orderBy:{id:'asc'}}); }
}
