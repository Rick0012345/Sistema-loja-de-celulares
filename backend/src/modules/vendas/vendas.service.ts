import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  origem_movimentacao_estoque,
  status_pagamento,
  tipo_conta_financeira,
  tipo_movimentacao_estoque,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { toNumber } from '../../common/utils/serialize';
import { CreateVendaDto } from './vendas.dto';

@Injectable()
export class VendasService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const contas = await this.prisma.contas_financeiras.findMany({
      where: {
        tipo: tipo_conta_financeira.receber,
        descricao: { startsWith: 'Venda balcão #' },
      },
      include: {
        clientes: true,
      },
      orderBy: { created_at: 'desc' },
    });

    const referencias = contas.map((conta) =>
      this.extractSaleRef(conta.descricao, conta.id),
    );
    const movimentacoes = referencias.length
      ? await this.prisma.movimentacoes_estoque.findMany({
          where: {
            tipo: tipo_movimentacao_estoque.saida,
            origem: origem_movimentacao_estoque.ajuste_manual,
            origem_id: { in: referencias },
          },
          include: {
            produtos_pecas: true,
          },
          orderBy: { created_at: 'desc' },
        })
      : [];

    const itensPorRef = movimentacoes.reduce<
      Record<
        string,
        Array<{
          produto_id: string;
          produto_nome: string;
          quantidade: number;
          preco_unitario: number;
          subtotal: number;
        }>
      >
    >((acc, item) => {
      const ref = item.origem_id;
      if (!ref) {
        return acc;
      }
      acc[ref] = [
        ...(acc[ref] ?? []),
        {
          produto_id: item.produto_id,
          produto_nome: item.produtos_pecas.nome,
          quantidade: item.quantidade,
          preco_unitario: toNumber(item.produtos_pecas.preco_venda) ?? 0,
          subtotal: (toNumber(item.produtos_pecas.preco_venda) ?? 0) * item.quantidade,
        },
      ];
      return acc;
    }, {});

    return contas.map((conta) => {
      const referencia = this.extractSaleRef(conta.descricao, conta.id);
      const itens = itensPorRef[referencia] ?? [];

      return {
        id: referencia,
        referencia,
        cliente_nome: conta.clientes?.nome ?? 'Cliente não informado',
        meio_pagamento: this.extractPaymentMethod(conta.descricao),
        valor_total: toNumber(conta.valor),
        criado_em: conta.created_at,
        itens,
      };
    });
  }

  async create(dto: CreateVendaDto) {
    if (!dto.itens.length) {
      throw new BadRequestException('Informe pelo menos um item para registrar a venda.');
    }

    const produtoIds = [...new Set(dto.itens.map((item) => item.produto_id))];
    const produtos = await this.prisma.produtos_pecas.findMany({
      where: { id: { in: produtoIds }, ativo: true },
    });
    const produtoPorId = new Map(produtos.map((produto) => [produto.id, produto]));

    const itensNormalizados = dto.itens.map((item) => {
      const produto = produtoPorId.get(item.produto_id);
      if (!produto) {
        throw new NotFoundException('Produto não encontrado ou inativo.');
      }

      if (produto.quantidade_estoque < item.quantidade) {
        throw new BadRequestException(
          `Estoque insuficiente para o produto "${produto.nome}".`,
        );
      }

      return {
        produtoId: produto.id,
        produtoNome: produto.nome,
        quantidade: item.quantidade,
        precoVenda: toNumber(produto.preco_venda) ?? 0,
      };
    });

    const valorTotal = itensNormalizados.reduce(
      (acc, item) => acc + item.precoVenda * item.quantidade,
      0,
    );

    const referencia = randomUUID();
    const descricaoConta = `Venda balcão #${referencia} | pagamento:${dto.meio_pagamento}`;
    const clienteNome = dto.cliente_nome?.trim() || 'Cliente não informado';

    await this.prisma.$transaction(async (tx) => {
      await Promise.all(
        itensNormalizados.map((item) =>
          tx.produtos_pecas.update({
            where: { id: item.produtoId },
            data: { quantidade_estoque: { decrement: item.quantidade } },
          }),
        ),
      );

      await tx.movimentacoes_estoque.createMany({
        data: itensNormalizados.map((item) => ({
          produto_id: item.produtoId,
          tipo: tipo_movimentacao_estoque.saida,
          origem: origem_movimentacao_estoque.ajuste_manual,
          origem_id: referencia,
          quantidade: item.quantidade,
          observacao: `Venda de balcão (${clienteNome}).`,
        })),
      });

      await tx.contas_financeiras.create({
        data: {
          tipo: tipo_conta_financeira.receber,
          cliente_id: dto.cliente_id ?? null,
          descricao: descricaoConta,
          valor: new Prisma.Decimal(valorTotal),
          vencimento: new Date(),
          status: status_pagamento.pago,
          pago_em: new Date(),
        },
      });
    });

    return {
      id: referencia,
      referencia,
      cliente_nome: clienteNome,
      meio_pagamento: dto.meio_pagamento,
      valor_total: valorTotal,
      criado_em: new Date().toISOString(),
      itens: itensNormalizados.map((item) => ({
        produto_id: item.produtoId,
        produto_nome: item.produtoNome,
        quantidade: item.quantidade,
        preco_unitario: item.precoVenda,
        subtotal: item.precoVenda * item.quantidade,
      })),
    };
  }

  private extractSaleRef(descricao: string, fallback: string) {
    const match = descricao.match(/Venda balcão #([^| ]+)/);
    return match?.[1] ?? fallback;
  }

  private extractPaymentMethod(descricao: string) {
    const match = descricao.match(/pagamento:([a-z_]+)/);
    return match?.[1] ?? 'dinheiro';
  }
}
