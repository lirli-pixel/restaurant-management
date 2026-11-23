import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard, Roles, RolesGuard } from '../auth/security';
@ApiTags('Аналитика') @ApiBearerAuth() @Controller('analytics') @UseGuards(JwtAuthGuard,RolesGuard) @Roles('ADMIN')
export class AnalyticsController {
  constructor(private prisma:PrismaService) {}
  @Get() async summary() {
    const [users,reservations,orders,paid,menuItems,tables]=await Promise.all([
      this.prisma.user.count(),this.prisma.reservation.count(),this.prisma.order.count(),
      this.prisma.order.aggregate({where:{status:'PAID'},_sum:{total:true}}),
      this.prisma.menuItem.count({where:{available:true}}),this.prisma.restaurantTable.count({where:{active:true}})
    ]);
    return {users,reservations,orders,revenue:Number(paid._sum.total||0),menuItems,tables};
  }
}
