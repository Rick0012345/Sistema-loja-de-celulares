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
import { WebhookEventosService } from '../webhooks/webhook-eventos.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly webhookEventosService: WebhookEventosService,
  ) {}

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
      filaOperacional,
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
          pagamentos_os: true,
        },
      }),
      this.prisma.produtos_pecas.findMany({
        where: {
          ativo: true,
        },
        orderBy: [{ quantidade_estoque: 'asc' }, { nome: 'asc' }],
        include: {
          fornecedores: true,
        },
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
      this.getFilaOperacional(),
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
      ordensRecentes: ordensRecentes.map((ordem) => {
        const saldoPendente =
          (toNumber(ordem.valor_total) ?? 0) -
          ordem.pagamentos_os.reduce(
            (acc, pagamento) =>
              pagamento.status === status_pagamento.pago
                ? acc + (toNumber(pagamento.valor) ?? 0)
                : acc,
            0,
          );

        return {
          id: ordem.id,
          cliente: ordem.clientes.nome,
          aparelho: `${ordem.aparelho_marca} ${ordem.aparelho_modelo}`,
          status: ordem.status,
          valor_total: toNumber(ordem.valor_total),
          saldo_pendente: Math.max(0, saldoPendente),
          created_at: ordem.created_at,
        };
      }),
      produtosBaixoEstoque: estoqueBaixo.slice(0, 5).map((produto) => ({
        id: produto.id,
        nome: produto.nome,
        quantidade_estoque: produto.quantidade_estoque,
        estoque_minimo: produto.estoque_minimo,
        fornecedor_nome: produto.fornecedores?.nome ?? null,
      })),
      filaOperacional,
    };
  }

  async getFilaOperacional() {
    const ordens = await this.prisma.ordens_servico.findMany({
      where: {
        status: {
          in: [
            status_ordem_servico.aguardando_aprovacao,
            status_ordem_servico.aguardando_peca,
            status_ordem_servico.em_conserto,
            status_ordem_servico.pronto_para_retirada,
          ],
        },
      },
      orderBy: [{ updated_at: 'desc' }],
      include: {
        clientes: true,
        itens_os: true,
        pagamentos_os: true,
      },
    });

    const webhookStateMap = await this.webhookEventosService.getWebhookStateMap(
      ordens.map((ordem) => ordem.id),
    );

    return ordens.map((ordem) => {
      const valorTotal = toNumber(ordem.valor_total) ?? 0;
      const valorPago = ordem.pagamentos_os.reduce(
        (acc, pagamento) =>
          pagamento.status === status_pagamento.pago
            ? acc + (toNumber(pagamento.valor) ?? 0)
            : acc,
        0,
      );
      const saldoPendente = Math.max(0, valorTotal - valorPago);
      const webhook = webhookStateMap.get(ordem.id) ?? null;
      const itemAguardandoFornecedor = ordem.itens_os.some(
        (item) => item.produto_id === null,
      );

      return {
        id: ordem.id,
        cliente: {
          nome: ordem.clientes.nome,
          telefone: ordem.clientes.telefone,
        },
        aparelho: `${ordem.aparelho_marca} ${ordem.aparelho_modelo}`,
        status: ordem.status,
        valor_total: valorTotal,
        saldo_pendente: saldoPendente,
        pronto_sem_contato_enviado:
          ordem.status === status_ordem_servico.pronto_para_retirada &&
          webhook?.status !== 'enviado',
        item_aguardando_fornecedor: itemAguardandoFornecedor,
        updated_at: ordem.updated_at,
        webhook_pronto: webhook,
      };
    });
  }

  async getRelatorios(input?: {
    dias?: number;
    origem?: 'todas' | 'ordem_servico' | 'venda';
  }) {
    const dias = Math.min(Math.max(input?.dias ?? 30, 1), 365);
    const origem = input?.origem ?? 'todas';
    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);
    inicio.setDate(inicio.getDate() - (dias - 1));

    const [ordensEntregues, pagamentosOs, vendas, custoVendas] =
      await Promise.all([
        this.prisma.ordens_servico.findMany({
          where: {
            created_at: { gte: inicio },
            status: {
              notIn: [
                status_ordem_servico.cancelada,
                status_ordem_servico.aguardando_orcamento,
              ],
            },
          },
          include: {
            clientes: true,
          },
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.pagamentos_os.findMany({
          where: {
            status: status_pagamento.pago,
            pago_em: { gte: inicio },
          },
          include: {
            ordens_servico: {
              include: { clientes: true },
            },
          },
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.contas_financeiras.findMany({
          where: {
            tipo: tipo_conta_financeira.receber,
            status: status_pagamento.pago,
            pago_em: { gte: inicio },
            descricao: { startsWith: 'Venda balcão #' },
          },
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.movimentacoes_estoque.findMany({
          where: {
            tipo: tipo_movimentacao_estoque.saida,
            origem: origem_movimentacao_estoque.venda,
            created_at: { gte: inicio },
          },
          select: {
            origem_id: true,
            quantidade: true,
            custo_unitario: true,
          },
        }),
      ]);

    const custoVendaPorOrigem = custoVendas.reduce<Record<string, number>>(
      (acc, item) => {
        const origemId = item.origem_id ?? 'sem_origem';
        acc[origemId] =
          (acc[origemId] ?? 0) +
          (toNumber(item.custo_unitario) ?? 0) * item.quantidade;
        return acc;
      },
      {},
    );

    const relatorioOs = pagamentosOs.map((pagamento) => ({
      origem: 'ordem_servico' as const,
      id: pagamento.ordem_servico_id,
      referencia: pagamento.ordens_servico?.id ?? pagamento.ordem_servico_id,
      cliente:
        pagamento.ordens_servico?.clientes.nome ?? 'Cliente não informado',
      descricao:
        `OS ${pagamento.ordens_servico?.aparelho_marca ?? ''} ${pagamento.ordens_servico?.aparelho_modelo ?? ''}`.trim(),
      valor: toNumber(pagamento.valor) ?? 0,
      lucro: ordensEntregues.find(
        (ordem) => ordem.id === pagamento.ordem_servico_id,
      )?.lucro_estimado
        ? (toNumber(
            ordensEntregues.find(
              (ordem) => ordem.id === pagamento.ordem_servico_id,
            )?.lucro_estimado ?? null,
          ) ?? 0)
        : 0,
      data: pagamento.pago_em ?? pagamento.created_at,
      meio_pagamento: pagamento.meio,
    }));

    const relatorioVendas = vendas.map((venda) => ({
      origem: 'venda' as const,
      id: venda.id,
      referencia: venda.descricao.replace('Venda balcão #', ''),
      cliente: venda.descricao.includes('Cliente:')
        ? venda.descricao.split('Cliente:')[1]?.trim() || 'Balcão'
        : 'Balcão',
      descricao: venda.descricao,
      valor: toNumber(venda.valor) ?? 0,
      lucro:
        (toNumber(venda.valor) ?? 0) - (custoVendaPorOrigem[venda.id] ?? 0),
      data: venda.pago_em ?? venda.created_at,
      meio_pagamento: null,
    }));

    const items = [...relatorioOs, ...relatorioVendas]
      .filter((item) => origem === 'todas' || item.origem === origem)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    const faturamentoTotal = items.reduce((acc, item) => acc + item.valor, 0);
    const lucroTotal = items.reduce((acc, item) => acc + item.lucro, 0);
    const porOrigem = {
      ordem_servico: items
        .filter((item) => item.origem === 'ordem_servico')
        .reduce(
          (acc, item) => ({
            faturamento: acc.faturamento + item.valor,
            lucro: acc.lucro + item.lucro,
            quantidade: acc.quantidade + 1,
          }),
          { faturamento: 0, lucro: 0, quantidade: 0 },
        ),
      venda: items
        .filter((item) => item.origem === 'venda')
        .reduce(
          (acc, item) => ({
            faturamento: acc.faturamento + item.valor,
            lucro: acc.lucro + item.lucro,
            quantidade: acc.quantidade + 1,
          }),
          { faturamento: 0, lucro: 0, quantidade: 0 },
        ),
    };

    const porFormaPagamento = pagamentosOs.reduce<Record<string, number>>(
      (acc, pagamento) => {
        acc[pagamento.meio] =
          (acc[pagamento.meio] ?? 0) + (toNumber(pagamento.valor) ?? 0);
        return acc;
      },
      {},
    );

    return {
      periodo: { dias, inicio, origem },
      resumo: {
        faturamento_total: faturamentoTotal,
        lucro_total: lucroTotal,
      },
      porOrigem,
      porFormaPagamento,
      itens: items.slice(0, 100),
    };
  }
}
