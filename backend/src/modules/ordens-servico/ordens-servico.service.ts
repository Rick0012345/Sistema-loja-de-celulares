import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  origem_movimentacao_estoque,
  Prisma,
  status_ordem_servico,
  tipo_movimentacao_estoque,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { toNumber } from '../../common/utils/serialize';
import { AuthenticatedUser } from '../auth/auth.types';
import {
  CreateItemOrdemServicoDto,
  CreateOrdemServicoDto,
  UpdateStatusOrdemServicoDto,
} from './ordens-servico.dto';

type OrdemServicoCompleta = Prisma.ordens_servicoGetPayload<{
  include: {
    clientes: true;
    itens_os: true;
    historico_status_os: true;
  };
}>;

type ItemOrdemComProduto = {
  id: string;
  produto_id: string;
  quantidade: number;
};

@Injectable()
export class OrdensServicoService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const ordens = await this.prisma.ordens_servico.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        clientes: true,
        itens_os: true,
        historico_status_os: {
          orderBy: { created_at: 'desc' },
        },
      },
    });

    return ordens.map((ordem) => this.serializeOrdem(ordem));
  }

  async findOne(id: string) {
    const ordem = await this.prisma.ordens_servico.findUnique({
      where: { id },
      include: {
        clientes: true,
        itens_os: true,
        historico_status_os: {
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!ordem) {
      throw new NotFoundException('Ordem de servico nao encontrada.');
    }

    return this.serializeOrdem(ordem);
  }

  async create(dto: CreateOrdemServicoDto, currentUser: AuthenticatedUser) {
    return this.prisma.$transaction(async (tx) => {
      const cliente = await tx.clientes.findUnique({
        where: { id: dto.cliente_id },
        select: { id: true },
      });

      if (!cliente) {
        throw new NotFoundException('Cliente nao encontrado.');
      }

      const itensPreparados = await Promise.all(
        (dto.itens ?? []).map((item) => this.prepareItem(tx, item)),
      );

      const valorMaoDeObra = dto.valor_mao_de_obra ?? 0;
      const desconto = dto.desconto ?? 0;
      const totalItens = itensPreparados.reduce((acc, item) => acc + item.subtotal, 0);
      const lucroItens = itensPreparados.reduce((acc, item) => acc + item.lucro, 0);
      const valorTotal = Math.max(totalItens + valorMaoDeObra - desconto, 0);
      const lucroEstimado = Math.max(lucroItens + valorMaoDeObra - desconto, 0);

      const ordem = await tx.ordens_servico.create({
        data: {
          cliente_id: dto.cliente_id,
          atendente_id: dto.atendente_id ?? currentUser.sub,
          tecnico_id: dto.tecnico_id,
          aparelho_marca: dto.aparelho_marca,
          aparelho_modelo: dto.aparelho_modelo,
          aparelho_cor: dto.aparelho_cor,
          imei: dto.imei,
          defeito_relatado: dto.defeito_relatado,
          observacoes: dto.observacoes,
          senha_desbloqueio: null,
          termo_responsabilidade_aceito: dto.termo_responsabilidade_aceito,
          valor_mao_de_obra: valorMaoDeObra,
          desconto,
          valor_total: valorTotal,
          lucro_estimado: lucroEstimado,
        },
      });

      for (const item of itensPreparados) {
        await tx.itens_os.create({
          data: {
            ordem_servico_id: ordem.id,
            produto_id: item.produtoId,
            descricao_item: item.descricao,
            quantidade: item.quantidade,
            custo_unitario: item.custoUnitario,
            venda_unitaria: item.vendaUnitario,
            subtotal: item.subtotal,
          },
        });
      }

      await tx.historico_status_os.create({
        data: {
          ordem_servico_id: ordem.id,
          status_novo: status_ordem_servico.aguardando_orcamento,
          alterado_por: dto.atendente_id ?? currentUser.sub,
          observacao: 'Ordem de servico criada.',
        },
      });

      const completa = await tx.ordens_servico.findUniqueOrThrow({
        where: { id: ordem.id },
        include: {
          clientes: true,
          itens_os: true,
          historico_status_os: {
            orderBy: { created_at: 'desc' },
          },
        },
      });

      return this.serializeOrdem(completa);
    });
  }

  async updateStatus(
    id: string,
    dto: UpdateStatusOrdemServicoDto,
    currentUser: AuthenticatedUser,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const ordem = await tx.ordens_servico.findUnique({
        where: { id },
        include: {
          itens_os: true,
        },
      });

      if (!ordem) {
        throw new NotFoundException('Ordem de servico nao encontrada.');
      }

      if (ordem.status === dto.status) {
        throw new BadRequestException('A ordem de servico ja esta nesse status.');
      }

      this.ensureTransitionAllowed(ordem.status, dto.status);
      await this.syncStockForStatus(tx, ordem.id, ordem.itens_os, dto.status);

      const atualizada = await tx.ordens_servico.update({
        where: { id },
        data: {
          status: dto.status,
          data_saida: dto.status === status_ordem_servico.entregue ? new Date() : null,
        },
      });

      await tx.historico_status_os.create({
        data: {
          ordem_servico_id: atualizada.id,
          status_anterior: ordem.status,
          status_novo: dto.status,
          alterado_por: currentUser.sub,
          observacao: dto.observacao,
        },
      });

      const completa = await tx.ordens_servico.findUniqueOrThrow({
        where: { id: atualizada.id },
        include: {
          clientes: true,
          itens_os: true,
          historico_status_os: {
            orderBy: { created_at: 'desc' },
          },
        },
      });

      return this.serializeOrdem(completa);
    });
  }

  private async prepareItem(
    tx: Prisma.TransactionClient,
    item: CreateItemOrdemServicoDto,
  ) {
    if (item.produto_id) {
      const produto = await tx.produtos_pecas.findUnique({
        where: { id: item.produto_id },
      });

      if (!produto) {
        throw new NotFoundException('Produto informado para a OS nao foi encontrado.');
      }

      const custoUnitario = item.custo_unitario ?? toNumber(produto.preco_custo) ?? 0;
      const vendaUnitario = item.venda_unitaria ?? toNumber(produto.preco_venda) ?? 0;

      return {
        produtoId: produto.id,
        descricao: item.descricao_item ?? produto.nome,
        quantidade: item.quantidade,
        custoUnitario,
        vendaUnitario,
        subtotal: vendaUnitario * item.quantidade,
        lucro: (vendaUnitario - custoUnitario) * item.quantidade,
      };
    }

    if (
      !item.descricao_item ||
      item.custo_unitario === undefined ||
      item.venda_unitaria === undefined
    ) {
      throw new BadRequestException(
        'Itens sem produto exigem descricao, custo unitario e venda unitaria.',
      );
    }

    return {
      produtoId: null,
      descricao: item.descricao_item,
      quantidade: item.quantidade,
      custoUnitario: item.custo_unitario,
      vendaUnitario: item.venda_unitaria,
      subtotal: item.venda_unitaria * item.quantidade,
      lucro: (item.venda_unitaria - item.custo_unitario) * item.quantidade,
    };
  }

  private ensureTransitionAllowed(
    currentStatus: status_ordem_servico,
    nextStatus: status_ordem_servico,
  ) {
    const allowedTransitions: Record<status_ordem_servico, status_ordem_servico[]> = {
      aguardando_orcamento: [
        status_ordem_servico.aguardando_aprovacao,
        status_ordem_servico.aguardando_peca,
        status_ordem_servico.em_conserto,
        status_ordem_servico.cancelada,
      ],
      aguardando_aprovacao: [
        status_ordem_servico.aguardando_peca,
        status_ordem_servico.em_conserto,
        status_ordem_servico.cancelada,
      ],
      aguardando_peca: [
        status_ordem_servico.em_conserto,
        status_ordem_servico.cancelada,
      ],
      em_conserto: [
        status_ordem_servico.pronto_para_retirada,
        status_ordem_servico.cancelada,
      ],
      pronto_para_retirada: [
        status_ordem_servico.entregue,
        status_ordem_servico.cancelada,
      ],
      entregue: [],
      cancelada: [],
    };

    if (!allowedTransitions[currentStatus].includes(nextStatus)) {
      throw new BadRequestException(
        `Nao e permitido mudar a OS de ${currentStatus} para ${nextStatus}.`,
      );
    }
  }

  private async syncStockForStatus(
    tx: Prisma.TransactionClient,
    ordemId: string,
    itens: Array<{ id: string; produto_id: string | null; quantidade: number }>,
    nextStatus: status_ordem_servico,
  ) {
    const itensComProduto = itens.filter(
      (item): item is ItemOrdemComProduto => item.produto_id !== null,
    );

    if (itensComProduto.length === 0) {
      return;
    }

    const itensAgrupados = Object.values(
      itensComProduto.reduce<Record<string, { produtoId: string; quantidade: number }>>(
        (acc, item) => {
          const current = acc[item.produto_id] ?? {
            produtoId: item.produto_id,
            quantidade: 0,
          };
          current.quantidade += item.quantidade;
          acc[item.produto_id] = current;
          return acc;
        },
        {},
      ),
    );

    const movimentos = await tx.movimentacoes_estoque.findMany({
      where: {
        origem: origem_movimentacao_estoque.ordem_servico,
        origem_id: ordemId,
      },
    });

    const saldoPorProduto = movimentos.reduce<Record<string, number>>((acc, movimento) => {
      const delta =
        movimento.tipo === tipo_movimentacao_estoque.entrada
          ? movimento.quantidade
          : movimento.tipo === tipo_movimentacao_estoque.saida
            ? -movimento.quantidade
            : movimento.quantidade;
      acc[movimento.produto_id] = (acc[movimento.produto_id] ?? 0) + delta;
      return acc;
    }, {});

    const precisaConsumir =
      [
        status_ordem_servico.em_conserto,
        status_ordem_servico.pronto_para_retirada,
        status_ordem_servico.entregue,
      ].includes(nextStatus) &&
      itensAgrupados.some((item) => (saldoPorProduto[item.produtoId] ?? 0) === 0);

    if (precisaConsumir) {
      for (const item of itensAgrupados) {
        if ((saldoPorProduto[item.produtoId] ?? 0) !== 0) {
          continue;
        }

        const produto = await tx.produtos_pecas.findUnique({
          where: { id: item.produtoId },
        });

        if (!produto) {
          throw new NotFoundException('Produto informado para a OS nao foi encontrado.');
        }

        if (produto.quantidade_estoque < item.quantidade) {
          throw new BadRequestException(
            `Estoque insuficiente para iniciar o conserto de ${produto.nome}.`,
          );
        }

        await tx.produtos_pecas.update({
          where: { id: produto.id },
          data: {
            quantidade_estoque: {
              decrement: item.quantidade,
            },
          },
        });

        await tx.movimentacoes_estoque.create({
          data: {
            produto_id: produto.id,
            tipo: tipo_movimentacao_estoque.saida,
            origem: origem_movimentacao_estoque.ordem_servico,
            origem_id: ordemId,
            quantidade: item.quantidade,
            custo_unitario: produto.preco_custo,
            observacao: 'Consumo automatico ao iniciar execucao da ordem de servico.',
          },
        });
      }
    }

    if (nextStatus === status_ordem_servico.cancelada) {
      for (const item of itensAgrupados) {
        const saldoAtual = saldoPorProduto[item.produtoId] ?? 0;

        if (saldoAtual >= 0) {
          continue;
        }

        const quantidadeParaEstornar = Math.abs(saldoAtual);
        const produto = await tx.produtos_pecas.findUnique({
          where: { id: item.produtoId },
        });

        if (!produto) {
          throw new NotFoundException('Produto informado para a OS nao foi encontrado.');
        }

        await tx.produtos_pecas.update({
          where: { id: produto.id },
          data: {
            quantidade_estoque: {
              increment: quantidadeParaEstornar,
            },
          },
        });

        await tx.movimentacoes_estoque.create({
          data: {
            produto_id: produto.id,
            tipo: tipo_movimentacao_estoque.entrada,
            origem: origem_movimentacao_estoque.ordem_servico,
            origem_id: ordemId,
            quantidade: quantidadeParaEstornar,
            custo_unitario: produto.preco_custo,
            observacao: 'Estorno automatico por cancelamento da ordem de servico.',
          },
        });
      }
    }
  }

  private serializeOrdem(ordem: OrdemServicoCompleta) {
    const {
      senha_desbloqueio: _senhaDesbloqueio,
      clientes,
      itens_os,
      historico_status_os,
      ...rest
    } = ordem as OrdemServicoCompleta & { senha_desbloqueio?: string | null };

    const itensSerializados = itens_os.map((item) => ({
      ...item,
      custo_unitario: toNumber(item.custo_unitario),
      venda_unitaria: toNumber(item.venda_unitaria),
      subtotal: toNumber(item.subtotal),
    }));

    return {
      ...rest,
      clientes,
      itens_os: itensSerializados,
      historico_status_os,
      valor_mao_de_obra: toNumber(rest.valor_mao_de_obra),
      desconto: toNumber(rest.desconto),
      valor_total: toNumber(rest.valor_total),
      lucro_estimado: toNumber(rest.lucro_estimado),
      cliente: clientes,
      itens: itensSerializados,
      historico: historico_status_os,
    };
  }
}
