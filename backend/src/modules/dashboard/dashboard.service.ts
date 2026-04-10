import { Injectable } from '@nestjs/common';
import {
  origem_movimentacao_estoque,
  status_ordem_servico,
  status_pagamento,
  tipo_conta_financeira,
  tipo_movimentacao_estoque,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { toNumber } from '../../common/utils/serialize';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getResumo() {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const [
      totalClientes,
      totalProdutos,
      totalOrdensAbertas,
      ordensRecentes,
      produtosBaixoEstoque,
      pagamentosMes,
      vendasMes,
      custoVendasMes,
    ] = await Promise.all([
      this.prisma.clientes.count(),
      this.prisma.produtos_pecas.count({
        where: { ativo: true },
      }),
      this.prisma.ordens_servico.count({
        where: {
          status: {
            notIn: [
              status_ordem_servico.entregue,
              status_ordem_servico.cancelada,
            ],
          },
        },
      }),
      this.prisma.ordens_servico.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        include: {
          clientes: true,
        },
      }),
      this.prisma.produtos_pecas.findMany({
        where: {
          ativo: true,
        },
        orderBy: [{ quantidade_estoque: 'asc' }, { nome: 'asc' }],
      }),
      this.prisma.pagamentos_os.findMany({
        where: {
          status: status_pagamento.pago,
          pago_em: {
            gte: inicioMes,
          },
        },
      }),
      this.prisma.contas_financeiras.findMany({
        where: {
          tipo: tipo_conta_financeira.receber,
          status: status_pagamento.pago,
          pago_em: {
            gte: inicioMes,
          },
          descricao: {
            startsWith: 'Venda balcão #',
          },
        },
      }),
      this.prisma.movimentacoes_estoque.findMany({
        where: {
          tipo: tipo_movimentacao_estoque.saida,
          origem: origem_movimentacao_estoque.venda,
          created_at: {
            gte: inicioMes,
          },
        },
        select: {
          quantidade: true,
          custo_unitario: true,
        },
      }),
    ]);

    const estoqueBaixo = produtosBaixoEstoque.filter(
      (produto) => produto.quantidade_estoque <= produto.estoque_minimo,
    );

    const faturamentoOsMes = pagamentosMes.reduce(
      (acc, pagamento) => acc + (toNumber(pagamento.valor) ?? 0),
      0,
    );
    const faturamentoVendasMes = vendasMes.reduce(
      (acc, venda) => acc + (toNumber(venda.valor) ?? 0),
      0,
    );
    const faturamentoMes = faturamentoOsMes + faturamentoVendasMes;

    const lucroMes = (
      await this.prisma.ordens_servico.aggregate({
        _sum: { lucro_estimado: true },
        where: {
          created_at: {
            gte: inicioMes,
          },
          status: {
            not: status_ordem_servico.cancelada,
          },
        },
      })
    )._sum.lucro_estimado;

    const lucroVendasMes =
      faturamentoVendasMes -
      custoVendasMes.reduce(
        (acc, movimentacao) =>
          acc +
          (toNumber(movimentacao.custo_unitario) ?? 0) *
            movimentacao.quantidade,
        0,
      );

    return {
      indicadores: {
        totalClientes,
        totalProdutos,
        totalOrdensAbertas,
        totalProdutosBaixoEstoque: estoqueBaixo.length,
        faturamentoMes,
        lucroMes: (toNumber(lucroMes) ?? 0) + lucroVendasMes,
      },
      ordensRecentes: ordensRecentes.map((ordem) => ({
        id: ordem.id,
        cliente: ordem.clientes.nome,
        aparelho: `${ordem.aparelho_marca} ${ordem.aparelho_modelo}`,
        status: ordem.status,
        valor_total: toNumber(ordem.valor_total),
        created_at: ordem.created_at,
      })),
      produtosBaixoEstoque: estoqueBaixo.slice(0, 5).map((produto) => ({
        id: produto.id,
        nome: produto.nome,
        quantidade_estoque: produto.quantidade_estoque,
        estoque_minimo: produto.estoque_minimo,
      })),
    };
  }
}
