import { Injectable } from '@nestjs/common';
import {
  Prisma,
  notificacao_severidade,
  notificacao_tipo,
  status_ordem_servico,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

type CreateNotificationInput = {
  tipo: notificacao_tipo;
  titulo: string;
  mensagem: string;
  severidade?: notificacao_severidade;
  referencia_tipo?: string;
  referencia_id?: string;
  metadados?: Prisma.InputJsonValue;
};

@Injectable()
export class NotificacoesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(limit = 30) {
    const normalizedLimit = Number.isFinite(limit) ? limit : 30;
    const safeLimit = Math.min(Math.max(normalizedLimit, 1), 100);
    return this.withMissingTableFallback(
      () =>
        this.prisma.notificacoes.findMany({
          orderBy: { created_at: 'desc' },
          take: safeLimit,
        }),
      [],
    );
  }

  async markAsRead(id: string) {
    await this.withMissingTableFallback(
      () =>
        this.prisma.notificacoes.updateMany({
          where: { id },
          data: {
            lida: true,
            lida_em: new Date(),
          },
        }),
      null,
    );
    return { updated: true };
  }

  async markAllAsRead() {
    await this.withMissingTableFallback(
      () =>
        this.prisma.notificacoes.updateMany({
          where: { lida: false },
          data: {
            lida: true,
            lida_em: new Date(),
          },
        }),
      null,
    );
    return { updated: true };
  }

  async notifySaleRegistered(input: {
    referencia: string;
    clienteNome: string;
    valorTotal: number;
    itens: number;
  }) {
    await this.create({
      tipo: notificacao_tipo.venda_registrada,
      titulo: 'Nova venda registrada',
      mensagem: `Venda #${input.referencia} registrada para ${input.clienteNome}. Total: R$ ${input.valorTotal.toFixed(2)} (${input.itens} item(ns)).`,
      severidade: notificacao_severidade.success,
      referencia_tipo: 'venda',
      referencia_id: input.referencia,
      metadados: {
        valor_total: input.valorTotal,
        itens: input.itens,
      },
    });
  }

  async notifyOrderStatusChanged(input: {
    ordemId: string;
    clienteNome: string;
    status: status_ordem_servico;
  }) {
    const statusLabel = this.formatOrderStatus(input.status);
    await this.create({
      tipo: notificacao_tipo.ordem_status_atualizado,
      titulo: 'Status da OS atualizado',
      mensagem: `OS ${input.ordemId} do cliente ${input.clienteNome} foi atualizada para "${statusLabel}".`,
      severidade: notificacao_severidade.info,
      referencia_tipo: 'ordem_servico',
      referencia_id: input.ordemId,
      metadados: {
        status: input.status,
      },
    });
  }

  async notifyProductCreated(input: { produtoId: string; nome: string }) {
    await this.create({
      tipo: notificacao_tipo.produto_cadastrado,
      titulo: 'Produto cadastrado',
      mensagem: `O produto "${input.nome}" foi cadastrado no estoque.`,
      severidade: notificacao_severidade.info,
      referencia_tipo: 'produto',
      referencia_id: input.produtoId,
    });
  }

  async notifyStockStatus(input: {
    produtoId: string;
    nome: string;
    quantidade: number;
    estoqueMinimo: number;
  }) {
    const isCritical = input.quantidade <= 0;
    const isLow = input.quantidade <= input.estoqueMinimo;

    if (!isLow) {
      await this.markStockAlertsAsRead(input.produtoId);
      return;
    }

    const tipo = isCritical
      ? notificacao_tipo.estoque_critico
      : notificacao_tipo.estoque_baixo;
    const titulo = isCritical ? 'Estoque zerado' : 'Estoque acabando';
    const mensagem = isCritical
      ? `O produto "${input.nome}" ficou sem estoque.`
      : `O produto "${input.nome}" esta com ${input.quantidade} unidade(s), abaixo do minimo (${input.estoqueMinimo}).`;

    const existing = await this.withMissingTableFallback(
      () =>
        this.prisma.notificacoes.findFirst({
          where: {
            tipo,
            referencia_tipo: 'produto',
            referencia_id: input.produtoId,
            lida: false,
          },
          select: { id: true },
        }),
      null,
    );

    if (existing) {
      return;
    }

    await this.create({
      tipo,
      titulo,
      mensagem,
      severidade: isCritical
        ? notificacao_severidade.critical
        : notificacao_severidade.warning,
      referencia_tipo: 'produto',
      referencia_id: input.produtoId,
      metadados: {
        quantidade: input.quantidade,
        estoque_minimo: input.estoqueMinimo,
      },
    });
  }

  private async markStockAlertsAsRead(produtoId: string) {
    await this.withMissingTableFallback(
      () =>
        this.prisma.notificacoes.updateMany({
          where: {
            referencia_tipo: 'produto',
            referencia_id: produtoId,
            tipo: {
              in: [
                notificacao_tipo.estoque_baixo,
                notificacao_tipo.estoque_critico,
              ],
            },
            lida: false,
          },
          data: {
            lida: true,
            lida_em: new Date(),
          },
        }),
      null,
    );
  }

  private async create(input: CreateNotificationInput) {
    await this.withMissingTableFallback(
      () =>
        this.prisma.notificacoes.create({
          data: {
            tipo: input.tipo,
            titulo: input.titulo,
            mensagem: input.mensagem,
            severidade: input.severidade ?? notificacao_severidade.info,
            referencia_tipo: input.referencia_tipo,
            referencia_id: input.referencia_id,
            metadados: input.metadados,
          },
        }),
      null,
    );
  }

  private formatOrderStatus(status: status_ordem_servico) {
    const labels: Record<status_ordem_servico, string> = {
      aguardando_orcamento: 'Aguardando orcamento',
      aguardando_aprovacao: 'Aguardando aprovacao',
      aguardando_peca: 'Aguardando peca',
      em_conserto: 'Em conserto',
      pronto_para_retirada: 'Pronto para retirada',
      entregue: 'Entregue',
      cancelada: 'Cancelada',
    };

    return labels[status];
  }

  private async withMissingTableFallback<T>(
    operation: () => Promise<T>,
    fallback: T,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2021'
      ) {
        return fallback;
      }
      throw error;
    }
  }
}
