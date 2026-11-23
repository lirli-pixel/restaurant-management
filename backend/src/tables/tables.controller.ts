import { Body, Controller, Get, Post, Patch, Delete, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard, Roles, RolesGuard } from '../auth/security';
@ApiTags('Столики') @Controller('tables')
export class TablesController {
  constructor(private prisma:PrismaService) {}
  @Get() list() { return this.prisma.restaurantTable.findMany({where:{active:true},orderBy:{number:'asc'}}); }
  @Post() @ApiBearerAuth() @UseGuards(JwtAuthGuard,RolesGuard) @Roles('ADMIN')
  create(@Body() b:any) { return this.prisma.restaurantTable.create({data:{number:Number(b.number),seats:Number(b.seats),description:b.description}}); }
  @Patch(':id') @ApiBearerAuth() @UseGuards(JwtAuthGuard,RolesGuard) @Roles('ADMIN')
  update(@Param('id',ParseIntPipe) id:number,@Body() b:any) { return this.prisma.restaurantTable.update({where:{id},data:{...b,number:b.number===undefined?undefined:Number(b.number),seats:b.seats===undefined?undefined:Number(b.seats)}}); }
  @Delete(':id') @ApiBearerAuth() @UseGuards(JwtAuthGuard,RolesGuard) @Roles('ADMIN')
  remove(@Param('id',ParseIntPipe) id:number) { return this.prisma.restaurantTable.update({where:{id},data:{active:false}}); }
}
