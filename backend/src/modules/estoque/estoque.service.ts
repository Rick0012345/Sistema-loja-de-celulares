import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  origem_movimentacao_estoque,
  tipo_movimentacao_estoque,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { toNumber } from '../../common/utils/serialize';
import {
  CreateProdutoDto,
  RegistrarMovimentacaoDto,
  TipoEstoqueProdutoDto,
  UpdateProdutoDto,
} from './estoque.dto';
import { NotificacoesService } from '../notificacoes/notificacoes.service';

@Injectable()
export class EstoqueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificacoesService: NotificacoesService,
  ) {}

  async list() {
    const produtos = await this.prisma.produtos_pecas.findMany({
      where: { ativo: true },
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
          categoria_id: await this.resolveCategoriaId(tx, dto.tipo_estoque),
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

    await this.notificacoesService.notifyProductCreated({
      produtoId: produto.id,
      nome: produto.nome,
    });
    await this.notificacoesService.notifyStockStatus({
      produtoId: produto.id,
      nome: produto.nome,
      quantidade: produto.quantidade_estoque,
      estoqueMinimo: produto.estoque_minimo,
    });

    return {
      ...produto,
      preco_custo: toNumber(produto.preco_custo),
      preco_venda: toNumber(produto.preco_venda),
    };
  }

  async update(id: string, dto: UpdateProdutoDto) {
    const produto = await this.prisma.$transaction(async (tx) => {
      const atual = await tx.produtos_pecas.findUnique({
        where: { id },
        include: {
          categorias_produto: {
            select: { nome: true },
          },
        },
      });

      if (!atual || !atual.ativo) {
        throw new NotFoundException('Produto não encontrado.');
      }

      const quantidadeEstoque =
        dto.quantidade_estoque ?? atual.quantidade_estoque;
      const deltaEstoque = quantidadeEstoque - atual.quantidade_estoque;

      const produto = await tx.produtos_pecas.update({
        where: { id },
        data: {
          nome: dto.nome,
          marca: dto.marca,
          modelo_compatavel: dto.modelo_compatavel,
          categoria_id: await this.resolveCategoriaId(
            tx,
            dto.tipo_estoque ??
              this.getTipoEstoqueFromCategoria(atual.categorias_produto?.nome),
          ),
          sku: dto.sku,
          estoque_minimo: dto.estoque_minimo,
          preco_custo: dto.preco_custo,
          preco_venda: dto.preco_venda,
          quantidade_estoque: quantidadeEstoque,
        },
      });

      if (deltaEstoque !== 0) {
        await tx.movimentacoes_estoque.create({
          data: {
            produto_id: produto.id,
            tipo: tipo_movimentacao_estoque.ajuste,
            origem: origem_movimentacao_estoque.ajuste_manual,
            quantidade: deltaEstoque,
            custo_unitario: dto.preco_custo ?? atual.preco_custo,
            observacao: 'Ajuste automático de estoque via edição de produto.',
          },
        });
      }

      return {
        ...produto,
        preco_custo: toNumber(produto.preco_custo),
        preco_venda: toNumber(produto.preco_venda),
      };
    });

    await this.notificacoesService.notifyStockStatus({
      produtoId: produto.id,
      nome: produto.nome,
      quantidade: produto.quantidade_estoque,
      estoqueMinimo: produto.estoque_minimo,
    });

    return produto;
  }

  async remove(id: string) {
    const produto = await this.prisma.produtos_pecas.findUnique({
      where: { id },
      select: { id: true, ativo: true },
    });

    if (!produto || !produto.ativo) {
      throw new NotFoundException('Produto não encontrado.');
    }

    await this.prisma.produtos_pecas.update({
      where: { id },
      data: { ativo: false },
    });

    return { deleted: true };
  }

  async registrarMovimentacao(id: string, dto: RegistrarMovimentacaoDto) {
    const result = await this.prisma.$transaction(async (tx) => {
      const produto = await tx.produtos_pecas.findUnique({
        where: { id },
      });

      if (!produto) {
        throw new NotFoundException('Produto não encontrado.');
      }

      const estoqueDelta = this.getEstoqueDelta(dto.tipo, dto.quantidade);
      const novoEstoque = produto.quantidade_estoque + estoqueDelta;

      if (novoEstoque < 0) {
        throw new BadRequestException(
          'Estoque insuficiente para a movimentação.',
        );
      }

      const movimentacao = await tx.movimentacoes_estoque.create({
        data: {
          produto_id: produto.id,
          tipo: dto.tipo,
          origem: dto.origem,
          quantidade:
            dto.tipo === tipo_movimentacao_estoque.ajuste
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

    await this.notificacoesService.notifyStockStatus({
      produtoId: result.produto.id,
      nome: result.produto.nome,
      quantidade: result.produto.quantidade_estoque,
      estoqueMinimo: result.produto.estoque_minimo,
    });

    return result;
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
      select: { id: true, ativo: true },
    });

    if (!produto || !produto.ativo) {
      throw new NotFoundException('Produto não encontrado.');
    }
  }

  private async resolveCategoriaId(
    tx: Prisma.TransactionClient,
    tipo: TipoEstoqueProdutoDto,
  ) {
    const nomeCategoria =
      tipo === TipoEstoqueProdutoDto.venda ? 'venda' : 'manutencao';
    const categoriaExistente = await tx.categorias_produto.findFirst({
      where: {
        nome: {
          equals: nomeCategoria,
          mode: 'insensitive',
        },
      },
      select: { id: true },
    });

    if (categoriaExistente) {
      return categoriaExistente.id;
    }

    const categoriaCriada = await tx.categorias_produto.create({
      data: { nome: nomeCategoria },
      select: { id: true },
    });

    return categoriaCriada.id;
  }

  private getTipoEstoqueFromCategoria(categoriaNome?: string | null) {
    if (categoriaNome?.trim().toLowerCase() === 'venda') {
      return TipoEstoqueProdutoDto.venda;
    }

    if (!categoriaNome) {
      return TipoEstoqueProdutoDto.manutencao;
    }

    return TipoEstoqueProdutoDto.manutencao;
  }
}
