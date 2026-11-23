import { Module } from '@nestjs/common';
import { MenuController } from './menu.controller';
import { PrismaService } from '../prisma.service';
import { CacheService } from '../cache.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard, RolesGuard } from '../auth/security';
@Module({ imports:[JwtModule.register({secret:process.env.JWT_SECRET || 'dev-secret'})], controllers:[MenuController], providers:[PrismaService,CacheService,JwtAuthGuard,RolesGuard] })
export class MenuModule {}
