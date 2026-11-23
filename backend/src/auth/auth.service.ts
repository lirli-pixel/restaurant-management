import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}
  async register(data: any) {
    const exists = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (exists) throw new ConflictException('Пользователь с таким email уже существует');
    const password = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({ data: { name: data.name, email: data.email, password, role: 'CLIENT' } });
    return this.issue(user);
  }
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) throw new UnauthorizedException('Неверный email или пароль');
    return this.issue(user);
  }
  private issue(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role, name: user.name };
    return { accessToken: this.jwt.sign(payload), user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  }
}
