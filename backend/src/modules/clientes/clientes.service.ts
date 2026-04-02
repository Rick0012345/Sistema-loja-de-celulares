import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateClienteDto, UpdateClienteDto } from './clientes.dto';

@Injectable()
export class ClientesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.clientes.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const cliente = await this.prisma.clientes.findUnique({
      where: { id },
      include: {
        ordens_servico: {
          orderBy: { created_at: 'desc' },
          take: 5,
        },
      },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    return cliente;
  }

  create(dto: CreateClienteDto) {
    return this.prisma.clientes.create({
      data: {
        nome: dto.nome,
        telefone: dto.telefone,
        email: dto.email,
        cpf: dto.cpf,
      },
    });
  }

  async update(id: string, dto: UpdateClienteDto) {
    await this.ensureExists(id);

    return this.prisma.clientes.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);

    await this.prisma.clientes.delete({
      where: { id },
    });

    return { deleted: true };
  }

  private async ensureExists(id: string) {
    const cliente = await this.prisma.clientes.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente não encontrado.');
    }
  }
}
