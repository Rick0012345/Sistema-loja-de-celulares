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
    const notifications = await this.withMissingTableFallback(
      () =>
        this.prisma.notificacoes.findMany({
          orderBy: { created_at: 'desc' },
          take: safeLimit,
        }),
      [],
    );

    return this.hydrateOrderNotifications(notifications);
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
    aparelhoMarca?: string | null;
    aparelhoModelo?: string | null;
    status: status_ordem_servico;
  }) {
    const deviceLabel = this.formatDeviceLabel(
      input.aparelhoMarca,
      input.aparelhoModelo,
    );
    const readableMessage = this.formatOrderStatusMessage({
      clienteNome: input.clienteNome,
      deviceLabel,
      status: input.status,
    });

    await this.create({
      tipo: notificacao_tipo.ordem_status_atualizado,
      titulo: this.formatOrderStatusTitle(input.status),
      mensagem: readableMessage,
      severidade: notificacao_severidade.info,
      referencia_tipo: 'ordem_servico',
      referencia_id: input.ordemId,
      metadados: {
        status: input.status,
        cliente_nome: input.clienteNome,
        aparelho: deviceLabel,
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
      aguardando_orcamento: 'Aguardando orçamento',
      aguardando_aprovacao: 'Aguardando aprovação',
      aguardando_peca: 'Aguardando peça',
      em_conserto: 'Em conserto',
      pronto_para_retirada: 'Pronto para retirada',
      entregue: 'Entregue',
      cancelada: 'Cancelada',
    };

    return labels[status];
  }

  private formatOrderStatusTitle(status: status_ordem_servico) {
    const titles: Record<status_ordem_servico, string> = {
      aguardando_orcamento: 'OS aguardando orçamento',
      aguardando_aprovacao: 'OS aguardando aprovação',
      aguardando_peca: 'OS aguardando peça',
      em_conserto: 'OS em conserto',
      pronto_para_retirada: 'OS pronta para retirada',
      entregue: 'OS concluída',
      cancelada: 'OS cancelada',
    };

    return titles[status];
  }

  private formatOrderStatusPhrase(status: status_ordem_servico) {
    const phrases: Record<status_ordem_servico, string> = {
      aguardando_orcamento: 'aguardando orçamento',
      aguardando_aprovacao: 'aguardando aprovação',
      aguardando_peca: 'aguardando peça',
      em_conserto: 'em conserto',
      pronto_para_retirada: 'pronto para retirada',
      entregue: 'concluído',
      cancelada: 'cancelado',
    };

    return phrases[status];
  }

  private formatDeviceLabel(
    aparelhoMarca?: string | null,
    aparelhoModelo?: string | null,
  ) {
    const parts = [aparelhoMarca, aparelhoModelo]
      .map((part) => part?.trim())
      .filter((part): part is string => Boolean(part));

    return parts.length ? parts.join(' ') : 'Aparelho';
  }

  private formatOrderStatusMessage(input: {
    clienteNome: string;
    deviceLabel: string;
    status: status_ordem_servico;
  }) {
    return `${input.deviceLabel} de ${input.clienteNome} foi marcado como ${this.formatOrderStatusPhrase(input.status)}.`;
  }

  private async hydrateOrderNotifications(
    notifications: Array<{
      id: string;
      tipo: notificacao_tipo;
      titulo: string;
      mensagem: string;
      severidade: notificacao_severidade;
      referencia_tipo: string | null;
      referencia_id: string | null;
      metadados: Prisma.JsonValue | null;
      lida: boolean;
      lida_em: Date | null;
      created_at: Date;
    }>,
  ) {
    const orderIds = notifications
      .filter(
        (notification) =>
          notification.tipo === notificacao_tipo.ordem_status_atualizado &&
          notification.referencia_tipo === 'ordem_servico' &&
          notification.referencia_id,
      )
      .map((notification) => notification.referencia_id as string);

    if (orderIds.length === 0) {
      return notifications;
    }

    const orders = await this.prisma.ordens_servico.findMany({
      where: { id: { in: [...new Set(orderIds)] } },
      select: {
        id: true,
        status: true,
        aparelho_marca: true,
        aparelho_modelo: true,
        clientes: {
          select: {
            nome: true,
          },
        },
      },
    });

    const orderById = new Map(orders.map((order) => [order.id, order]));

    return notifications.map((notification) => {
      if (
        notification.tipo !== notificacao_tipo.ordem_status_atualizado ||
        notification.referencia_tipo !== 'ordem_servico' ||
        !notification.referencia_id
      ) {
        return notification;
      }

      const order = orderById.get(notification.referencia_id);
      if (!order) {
        return notification;
      }

      const deviceLabel = this.formatDeviceLabel(
        order.aparelho_marca,
        order.aparelho_modelo,
      );

      return {
        ...notification,
        titulo: this.formatOrderStatusTitle(order.status),
        mensagem: this.formatOrderStatusMessage({
          clienteNome: order.clientes?.nome ?? 'Cliente não informado',
          deviceLabel,
          status: order.status,
        }),
      };
    });
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
