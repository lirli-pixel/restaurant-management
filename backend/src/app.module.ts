import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MenuModule } from './menu/menu.module';
import { TablesModule } from './tables/tables.module';
import { ReservationsModule } from './reservations/reservations.module';
import { OrdersModule } from './orders/orders.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { CacheService } from './cache.service';

@Module({
  imports: [AuthModule, UsersModule, MenuModule, TablesModule, ReservationsModule, OrdersModule, AnalyticsModule],
  providers: [PrismaService, CacheService],
})
export class AppModule {}
