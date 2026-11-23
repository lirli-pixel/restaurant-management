import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { mkdirSync } from 'fs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma.service';
import { CacheService } from '../cache.service';
import { JwtAuthGuard, Roles, RolesGuard } from '../auth/security';
@ApiTags('Меню') @Controller('menu')
export class MenuController {
  constructor(private prisma:PrismaService, private cache:CacheService) {}
  
@Post(':id/image')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@UseInterceptors(FileInterceptor('file', {
storage: diskStorage({
destination: (req, file, callback) => {
mkdirSync('uploads/menu', { recursive: true });
callback(null, 'uploads/menu');
},
filename: (req, file, callback) => {
callback(null, `${Date.now()}${extname(file.originalname)}`);
},
}),
limits: { fileSize: 5 * 1024 * 1024 },
fileFilter: (req, file, callback) => {
if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
return callback(new BadRequestException('Разрешены только JPG, PNG и WebP'), false);
}
callback(null, true);
},
}))
async uploadImage(
@Param('id', ParseIntPipe) id: number,
@UploadedFile() file: Express.Multer.File,
) {
if (!file) throw new BadRequestException('Файл не выбран');

const item = await this.prisma.menuItem.update({
where: { id },
data: { imageUrl: `/uploads/menu/${file.filename}` },
});

await this.cache.del('menu');
return item;
}

  @Get() async list() {
    const cached = await this.cache.get('menu');
    if (cached) return JSON.parse(cached);
    const data = await this.prisma.menuItem.findMany({where:{available:true},orderBy:{category:'asc'}});
    await this.cache.set('menu',JSON.stringify(data),60); return data;
  }
  @Post() @ApiBearerAuth() @UseGuards(JwtAuthGuard,RolesGuard) @Roles('ADMIN')
  async create(@Body() body:any) { const item=await this.prisma.menuItem.create({data:{name:body.name,description:body.description,category:body.category,price:Number(body.price)}}); await this.cache.del('menu'); return item; }
  @Patch(':id') @ApiBearerAuth() @UseGuards(JwtAuthGuard,RolesGuard) @Roles('ADMIN')
  async update(@Param('id',ParseIntPipe) id:number,@Body() body:any) { const data={...body}; if(data.price!==undefined)data.price=Number(data.price); const item=await this.prisma.menuItem.update({where:{id},data}); await this.cache.del('menu'); return item; }
  @Delete(':id') @ApiBearerAuth() @UseGuards(JwtAuthGuard,RolesGuard) @Roles('ADMIN')
  async remove(@Param('id',ParseIntPipe) id:number) { const item=await this.prisma.menuItem.update({where:{id},data:{available:false}}); await this.cache.del('menu'); return item; }
}
