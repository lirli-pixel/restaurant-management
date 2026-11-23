import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const users = [
    { name: 'Администратор', email: 'admin@restaurant.local', password: 'Admin123!', role: Role.ADMIN },
    { name: 'Сотрудник', email: 'staff@restaurant.local', password: 'Staff123!', role: Role.STAFF },
    { name: 'Клиент', email: 'client@restaurant.local', password: 'Client123!', role: Role.CLIENT }
  ];
  for (const u of users) {
    const password = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, password }
    });
  }
  const tables = [{number:1,seats:2},{number:2,seats:2},{number:3,seats:4},{number:4,seats:4},{number:5,seats:6},{number:6,seats:8}];
  for (const t of tables) await prisma.restaurantTable.upsert({where:{number:t.number},update:{},create:t});
 const menu = [
  {name:'Цезарь с курицей',description:'Салат с курицей, пармезаном и соусом',category:'Салаты',price:21.56},
  {name:'Борщ',description:'Традиционный борщ со сметаной',category:'Супы',price:15.34},
  {name:'Паста Карбонара',description:'Паста с беконом и сливочным соусом',category:'Горячее',price:25.21},
  {name:'Стейк',description:'Говяжий стейк с гарниром',category:'Горячее',price:47.13},
  {name:'Чизкейк',description:'Нежный классический десерт',category:'Десерты',price:12.79},
  {name:'Морс',description:'Ягодный морс собственного приготовления',category:'Напитки',price:6.58}
];
for (const item of menu) {
  const exists = await prisma.menuItem.findFirst({where:{name:item.name}});
  if (exists) await prisma.menuItem.update({where:{id:exists.id},data:{price:item.price}});
  else await prisma.menuItem.create({data:item});
}
}
main().finally(() => prisma.$disconnect());
