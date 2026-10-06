import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !(await compare(dto.password, user.password)))
      throw new UnauthorizedException('Credenciales incorrectas');
    return {
      access_token: await this.jwt.signAsync({
        sub: user.id,
        email: user.email,
        role: user.role,
      }),
      token_type: 'Bearer',
      expires_in: 3600,
    };
  }
}
