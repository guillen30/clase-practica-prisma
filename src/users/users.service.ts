import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
const publicFields = {
  id: true,
  email: true,
  name: true,
  telephone: true,
  role: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
};
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
  findAll() {
    return this.prisma.user.findMany({
      select: publicFields,
      orderBy: { id: 'asc' },
    });
  }
  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: publicFields,
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }
  private fail(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002')
        throw new ConflictException('El correo ya existe');
      if (error.code === 'P2003')
        throw new BadRequestException('El tenant no existe');
      if (error.code === 'P2025')
        throw new NotFoundException('Usuario no encontrado');
    }
    throw error;
  }
  async create(dto: CreateUserDto) {
    try {
      return await this.prisma.user.create({
        data: {
          ...dto,
          password: await hash(dto.password, 10),
          role: dto.role ?? Role.USER,
        },
        select: publicFields,
      });
    } catch (error) {
      this.fail(error);
    }
  }
  async update(id: number, dto: UpdateUserDto) {
    try {
      const data = { ...dto };
      if (data.password) data.password = await hash(data.password, 10);
      return await this.prisma.user.update({
        where: { id },
        data,
        select: publicFields,
      });
    } catch (error) {
      this.fail(error);
    }
  }
  async remove(id: number) {
    try {
      return await this.prisma.user.delete({
        where: { id },
        select: publicFields,
      });
    } catch (error) {
      this.fail(error);
    }
  }
}
