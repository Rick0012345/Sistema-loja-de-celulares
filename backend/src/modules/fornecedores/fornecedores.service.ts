import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateFornecedorDto, UpdateFornecedorDto } from './fornecedores.dto';

@Injectable()
export class FornecedoresService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.fornecedores.findMany({
      orderBy: [{ ativo: 'desc' }, { nome: 'asc' }],
      include: {
        _count: {
          select: { produtos_pecas: true, contas_financeiras: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const fornecedor = await this.prisma.fornecedores.findUnique({
      where: { id },
      include: {
        produtos_pecas: {
          where: { ativo: true },
          orderBy: { nome: 'asc' },
          select: {
            id: true,
            nome: true,
            sku: true,
            quantidade_estoque: true,
            estoque_minimo: true,
          },
        },
        _count: {
          select: { produtos_pecas: true, contas_financeiras: true },
        },
      },
    });

    if (!fornecedor) {
      throw new NotFoundException('Fornecedor nao encontrado.');
    }

    return fornecedor;
  }

  async create(dto: CreateFornecedorDto) {
    const data = {
      nome: dto.nome.trim(),
      telefone: dto.telefone?.trim() || null,
      whatsapp: dto.whatsapp?.trim() || null,
      email: dto.email?.trim() || null,
      documento: dto.documento?.trim() || null,
      cidade: dto.cidade?.trim() || null,
      observacoes: dto.observacoes?.trim() || null,
    };

    return this.prisma.fornecedores.create({
      data: data as never,
    });
  }

  async update(id: string, dto: UpdateFornecedorDto) {
    const fornecedor = await this.prisma.fornecedores.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!fornecedor) {
      throw new NotFoundException('Fornecedor nao encontrado.');
    }

    const data = {
      nome: dto.nome?.trim(),
      telefone:
        dto.telefone !== undefined ? dto.telefone.trim() || null : undefined,
      whatsapp:
        dto.whatsapp !== undefined ? dto.whatsapp.trim() || null : undefined,
      email: dto.email !== undefined ? dto.email.trim() || null : undefined,
      documento:
        dto.documento !== undefined ? dto.documento.trim() || null : undefined,
      cidade: dto.cidade !== undefined ? dto.cidade.trim() || null : undefined,
      observacoes:
        dto.observacoes !== undefined
          ? dto.observacoes.trim() || null
          : undefined,
      ativo: dto.ativo,
      updated_at: new Date(),
    };

    return this.prisma.fornecedores.update({
      where: { id },
      data: data as never,
    });
  }

  async remove(id: string) {
    const fornecedor = await this.prisma.fornecedores.findUnique({
      where: { id },
      select: { id: true, ativo: true },
    });

    if (!fornecedor) {
      throw new NotFoundException('Fornecedor nao encontrado.');
    }

    if (!fornecedor.ativo) {
      return { deleted: true };
    }

    await this.prisma.fornecedores.update({
      where: { id },
      data: {
        ativo: false,
        updated_at: new Date(),
      },
    });

    return { deleted: true };
  }
}
