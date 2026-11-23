import { Module } from '@nestjs/common';
import { ReservationsController } from './reservations.controller';
import { PrismaService } from '../prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard, RolesGuard } from '../auth/security';
@Module({imports:[JwtModule.register({secret:process.env.JWT_SECRET || 'dev-secret'})],controllers:[ReservationsController],providers:[PrismaService,JwtAuthGuard,RolesGuard]})
export class ReservationsModule {}
