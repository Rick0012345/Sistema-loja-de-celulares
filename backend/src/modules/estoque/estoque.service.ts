import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  origem_movimentacao_estoque,
  tipo_movimentacao_estoque,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { toNumber } from '../../common/utils/serialize';
import {
  CreateProdutoDto,
  RegistrarMovimentacaoDto,
  UpdateProdutoDto,
} from './estoque.dto';

@Injectable()
export class EstoqueService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const produtos = await this.prisma.produtos_pecas.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        categorias_produto: true,
        fornecedores: true,
      },
    });

    return produtos.map((produto) => ({
      ...produto,
      preco_custo: toNumber(produto.preco_custo),
      preco_venda: toNumber(produto.preco_venda),
      estoque_baixo: produto.quantidade_estoque <= produto.estoque_minimo,
    }));
  }

  async findOne(id: string) {
    const produto = await this.prisma.produtos_pecas.findUnique({
      where: { id },
      include: {
        movimentacoes_estoque: {
          orderBy: { created_at: 'desc' },
          take: 10,
        },
      },
    });

    if (!produto) {
      throw new NotFoundException('Produto não encontrado.');
    }

    return {
      ...produto,
      preco_custo: toNumber(produto.preco_custo),
      preco_venda: toNumber(produto.preco_venda),
      movimentacoes_estoque: produto.movimentacoes_estoque.map((item) => ({
        ...item,
        custo_unitario: toNumber(item.custo_unitario),
      })),
    };
  }

  async create(dto: CreateProdutoDto) {
    const produto = await this.prisma.$transaction(async (tx) => {
      const created = await tx.produtos_pecas.create({
        data: {
          nome: dto.nome,
          marca: dto.marca,
          modelo_compatavel: dto.modelo_compatavel,
          sku: dto.sku,
          estoque_minimo: dto.estoque_minimo,
          quantidade_estoque: dto.quantidade_inicial ?? 0,
          preco_custo: dto.preco_custo,
          preco_venda: dto.preco_venda,
        },
      });

      if ((dto.quantidade_inicial ?? 0) > 0) {
        await tx.movimentacoes_estoque.create({
          data: {
            produto_id: created.id,
            tipo: tipo_movimentacao_estoque.entrada,
            origem: origem_movimentacao_estoque.compra,
            quantidade: dto.quantidade_inicial ?? 0,
            custo_unitario: dto.preco_custo,
            observacao: 'Estoque inicial do produto.',
          },
        });
      }

      return created;
    });

    return {
      ...produto,
      preco_custo: toNumber(produto.preco_custo),
      preco_venda: toNumber(produto.preco_venda),
    };
  }

  async update(id: string, dto: UpdateProdutoDto) {
    await this.ensureExists(id);

    const produto = await this.prisma.produtos_pecas.update({
      where: { id },
      data: {
        nome: dto.nome,
        marca: dto.marca,
        modelo_compatavel: dto.modelo_compatavel,
        sku: dto.sku,
        estoque_minimo: dto.estoque_minimo,
        preco_custo: dto.preco_custo,
        preco_venda: dto.preco_venda,
      },
    });

    return {
      ...produto,
      preco_custo: toNumber(produto.preco_custo),
      preco_venda: toNumber(produto.preco_venda),
    };
  }

  async registrarMovimentacao(id: string, dto: RegistrarMovimentacaoDto) {
    return this.prisma.$transaction(async (tx) => {
      const produto = await tx.produtos_pecas.findUnique({
        where: { id },
      });

      if (!produto) {
        throw new NotFoundException('Produto não encontrado.');
      }

      const estoqueDelta = this.getEstoqueDelta(dto.tipo, dto.quantidade);
      const novoEstoque = produto.quantidade_estoque + estoqueDelta;

      if (novoEstoque < 0) {
        throw new BadRequestException('Estoque insuficiente para a movimentação.');
      }

      const movimentacao = await tx.movimentacoes_estoque.create({
        data: {
          produto_id: produto.id,
          tipo: dto.tipo,
          origem: dto.origem,
          quantidade: dto.tipo === tipo_movimentacao_estoque.ajuste
            ? dto.quantidade
            : Math.abs(dto.quantidade),
          custo_unitario: dto.custo_unitario,
          observacao: dto.observacao,
        },
      });

      const atualizado = await tx.produtos_pecas.update({
        where: { id: produto.id },
        data: { quantidade_estoque: novoEstoque },
      });

      return {
        produto: {
          ...atualizado,
          preco_custo: toNumber(atualizado.preco_custo),
          preco_venda: toNumber(atualizado.preco_venda),
        },
        movimentacao: {
          ...movimentacao,
          custo_unitario: toNumber(movimentacao.custo_unitario),
        },
      };
    });
  }

  private getEstoqueDelta(tipo: tipo_movimentacao_estoque, quantidade: number) {
    if (tipo === tipo_movimentacao_estoque.entrada) {
      return Math.abs(quantidade);
    }

    if (tipo === tipo_movimentacao_estoque.saida) {
      return -Math.abs(quantidade);
    }

    return quantidade;
  }

  private async ensureExists(id: string) {
    const produto = await this.prisma.produtos_pecas.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!produto) {
      throw new NotFoundException('Produto não encontrado.');
    }
  }
}
