import { Injectable } from '@nestjs/common';
import { status_ordem_servico, status_pagamento } from '@prisma/client';
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
    ] = await Promise.all([
      this.prisma.clientes.count(),
      this.prisma.produtos_pecas.count({
        where: { ativo: true },
      }),
      this.prisma.ordens_servico.count({
        where: {
          status: {
            notIn: [status_ordem_servico.entregue, status_ordem_servico.cancelada],
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
          created_at: {
            gte: inicioMes,
          },
        },
      }),
    ]);

    const estoqueBaixo = produtosBaixoEstoque.filter(
      (produto) => produto.quantidade_estoque <= produto.estoque_minimo,
    );

    const faturamentoMes = pagamentosMes.reduce(
      (acc, pagamento) => acc + (toNumber(pagamento.valor) ?? 0),
      0,
    );

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

    return {
      indicadores: {
        totalClientes,
        totalProdutos,
        totalOrdensAbertas,
        totalProdutosBaixoEstoque: estoqueBaixo.length,
        faturamentoMes,
        lucroMes: toNumber(lucroMes) ?? 0,
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
