import { BadRequestException, Body, Controller, Get, Post, Patch, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma.service';
import { CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '../auth/security';
@ApiTags('Бронирования') @ApiBearerAuth() @Controller('reservations') @UseGuards(JwtAuthGuard,RolesGuard)
export class ReservationsController {
  constructor(private prisma:PrismaService) {}
  @Get() async list(@CurrentUser() user:any) {
    return this.prisma.reservation.findMany({where:user.role==='CLIENT'?{userId:user.sub}:{},include:{user:{select:{id:true,name:true,email:true}},table:true},orderBy:{startAt:'desc'}});
  }
  @Post() async create(@Body() b:any,@CurrentUser() user:any) {
    const startAt=new Date(b.startAt), endAt=new Date(b.endAt), guests=Number(b.guests), tableId=Number(b.tableId);
    if (!Number.isFinite(startAt.getTime()) || !Number.isFinite(endAt.getTime()) || endAt<=startAt || guests<1) throw new BadRequestException('Проверьте дату, время и количество гостей');
    const table=await this.prisma.restaurantTable.findFirst({where:{id:tableId,active:true}});
    if(!table || table.seats<guests) throw new BadRequestException('Столик не найден или недостаточно мест');
    const conflict=await this.prisma.reservation.findFirst({where:{tableId,startAt:{lt:endAt},endAt:{gt:startAt},status:{in:['PENDING','CONFIRMED']}}});
    if(conflict) throw new BadRequestException('На это время столик уже забронирован');
    return this.prisma.reservation.create({data:{userId:user.sub,tableId,startAt,endAt,guests,comment:b.comment},include:{table:true}});
  }
  @Patch(':id/status') @Roles('ADMIN','STAFF')
  updateStatus(@Param('id',ParseIntPipe) id:number,@Body() b:any) {
    const allowed=['PENDING','CONFIRMED','CANCELLED','COMPLETED'];
    if(!allowed.includes(b.status)) throw new BadRequestException('Недопустимый статус');
    return this.prisma.reservation.update({where:{id},data:{status:b.status},include:{user:true,table:true}});
  }
}
