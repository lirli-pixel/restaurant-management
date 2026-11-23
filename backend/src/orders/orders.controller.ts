
import { BadRequestException, Body, Controller, Get, Post, Patch, Param, ParseIntPipe, UseGuards, NotFoundException, } from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma.service';
import { CurrentUser, JwtAuthGuard, Roles, RolesGuard, } from '../auth/security';

@ApiTags('Заказы')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() user: any) {
    return this.prisma.order.findMany({
      where: user.role === 'CLIENT' ? { userId: user.sub } : {},
      include: {
        user: {
          select: { name: true, email: true },
        },
        items: {
          include: { menuItem: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post()
  async create(@Body() b: any, @CurrentUser() user: any) {
    if (!Array.isArray(b.items) || !b.items.length) {
      throw new BadRequestException('Добавьте хотя бы одно блюдо');
    }

    const ids = b.items.map((i: any) => Number(i.menuItemId));

    const menu = await this.prisma.menuItem.findMany({
      where: {
        id: { in: ids },
        available: true,
      },
    });

    const rows = b.items.map((i: any) => {
      const item = menu.find(
        m => m.id === Number(i.menuItemId),
      );

      const quantity = Number(i.quantity);

      if (
        !item ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 50
      ) {
        throw new BadRequestException(
          'Некорректная позиция заказа',
        );
      }

      return {
        menuItemId: item.id,
        quantity,
        unitPrice: item.price,
      };
    });

    const total = rows.reduce(
      (s: number, r: any) =>
        s + Number(r.unitPrice) * r.quantity,
      0,
    );

    return this.prisma.order.create({
      data: {
        userId: user.sub,
        total,
        note: b.note,
        items: { create: rows },
      },
      include: {
        items: { include: { menuItem: true } },
      },
    });
  }

  @Patch(':id/items')
  @Roles('ADMIN')
  async updateItems(
    @Param('id', ParseIntPipe) id: number,
    @Body() b: any,
  ) {
    if (!Array.isArray(b.items) || !b.items.length) {
      throw new BadRequestException(
        'В заказе должно остаться хотя бы одно блюдо',
      );
    }

    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('Заказ не найден');
    }

    const quantities = new Map<number, number>();

    for (const i of b.items) {
      const menuItemId = Number(i.menuItemId);
      const quantity = Number(i.quantity);

      if (
        !Number.isInteger(menuItemId) ||
        menuItemId < 1 ||
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        throw new BadRequestException(
          'Некорректное блюдо или количество',
        );
      }

      const newQuantity =
        (quantities.get(menuItemId) || 0) + quantity;

      if (newQuantity > 50) {
        throw new BadRequestException(
          'Максимальное количество одного блюда — 50',
        );
      }

      quantities.set(menuItemId, newQuantity);
    }

    const ids = Array.from(quantities.keys());

    const menu = await this.prisma.menuItem.findMany({
      where: {
        id: { in: ids },
        available: true,
      },
    });

    if (menu.length !== ids.length) {
      throw new BadRequestException(
        'Одно или несколько блюд недоступны',
      );
    }

    const rows = menu.map(item => ({
      orderId: id,
      menuItemId: item.id,
      quantity: quantities.get(item.id)!,
      unitPrice: item.price,
    }));

    const total = rows.reduce(
      (sum, item) =>
        sum + Number(item.unitPrice) * item.quantity,
      0,
    );

    return this.prisma.$transaction(async tx => {
      await tx.orderItem.deleteMany({
        where: { orderId: id },
      });

      await tx.orderItem.createMany({
        data: rows,
      });

      return tx.order.update({
        where: { id },
        data: { total },
        include: {
          user: {
            select: { name: true, email: true },
          },
          items: {
            include: { menuItem: true },
          },
        },
      });
    });
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'STAFF')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() b: any,
  ) {
    const allowed = [
      'NEW',
      'PREPARING',
      'READY',
      'PAID',
      'CANCELLED',
    ];

    if (!allowed.includes(b.status)) {
      throw new BadRequestException('Недопустимый статус');
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: b.status },
      include: { items: true },
    });
  }
}
