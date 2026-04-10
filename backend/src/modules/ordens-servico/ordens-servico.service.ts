import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  origem_movimentacao_estoque,
  status_pagamento,
  status_ordem_servico,
  tipo_movimentacao_estoque,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { toNumber } from '../../common/utils/serialize';
import type { AuthenticatedUser } from '../auth/auth.types';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
import { WebhookEventosService } from '../webhooks/webhook-eventos.service';
import type {
  CreateOrdemServicoDto,
  UpdateOrdemServicoDto,
  UpdateStatusOrdemServicoDto,
} from './ordens-servico.dto';

@Injectable()
export class OrdensServicoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificacoesService: NotificacoesService,
    private readonly webhookEventosService: WebhookEventosService,
  ) {}

  async list() {
    const ordens = await this.prisma.ordens_servico.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        clientes: true,
        itens_os: true,
        pagamentos_os: true,
      },
    });

    const webhookStateMap = await this.webhookEventosService.getWebhookStateMap(
      ordens.map((ordem) => ordem.id),
    );

    return ordens.map((ordem) =>
      this.serializeOrdem(ordem, webhookStateMap.get(ordem.id)),
    );
  }

  async findOne(id: string) {
    const ordem = await this.prisma.ordens_servico.findUnique({
      where: { id },
      include: {
        clientes: true,
        itens_os: true,
        historico_status_os: {
          orderBy: { created_at: 'desc' },
          include: {
            usuarios: {
              select: { id: true, nome: true, email: true, perfil: true },
            },
          },
        },
        pagamentos_os: {
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!ordem) {
      throw new NotFoundException('Ordem de serviço não encontrada.');
    }

    const webhookState =
      await this.webhookEventosService.getOrderWebhookState(id);

    const auditoria = await this.getOrderAudit(ordem.id);
    const timeline = await this.getOrderTimeline(ordem.id);

    return {
      ...this.serializeOrdem(ordem, webhookState),
      auditoria,
      historico_status_os: ordem.historico_status_os.map((item) => ({
        ...item,
        usuario: this.serializeUsuarioResumo(item.usuarios),
      })),
      pagamentos_os: ordem.pagamentos_os.map((pagamento) => ({
        ...pagamento,
        valor: toNumber(pagamento.valor),
      })),
      webhook_pronto: webhookState,
      timeline,
    };
  }

  async create(dto: CreateOrdemServicoDto, currentUser: AuthenticatedUser) {
    const cliente = await this.prisma.clientes.findUnique({
      where: { id: dto.cliente_id },
      select: { id: true },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    const itensData = await this.buildItensData(this.prisma, dto.itens ?? []);

    const totalPecas = itensData.reduce((acc, item) => acc + item.subtotal, 0);
    const lucroPecas = itensData.reduce(
      (acc, item) =>
        acc + (item.venda_unitaria - item.custo_unitario) * item.quantidade,
      0,
    );

    const valorMaoDeObra = dto.valor_mao_de_obra ?? 0;
    const desconto = dto.desconto ?? 0;
    const valorTotal = totalPecas + valorMaoDeObra - desconto;
    const lucroEstimado = lucroPecas + valorMaoDeObra - desconto;

    const created = await this.prisma.$transaction(async (tx) => {
      const ordem = await tx.ordens_servico.create({
        data: {
          cliente_id: dto.cliente_id,
          atendente_id: dto.atendente_id ?? currentUser.sub,
          tecnico_id: dto.tecnico_id ?? null,
          aparelho_marca: dto.aparelho_marca,
          aparelho_modelo: dto.aparelho_modelo,
          aparelho_cor: dto.aparelho_cor ?? null,
          imei: dto.imei ?? null,
          defeito_relatado: dto.defeito_relatado,
          observacoes: dto.observacoes ?? null,
          senha_desbloqueio: dto.senha_desbloqueio ?? null,
          termo_responsabilidade_aceito: dto.termo_responsabilidade_aceito,
          tipo_entrega: dto.tipo_entrega ?? 'retirada_loja',
          valor_mao_de_obra: valorMaoDeObra,
          desconto,
          valor_total: valorTotal,
          lucro_estimado: lucroEstimado,
          status: status_ordem_servico.aguardando_orcamento,
          itens_os: itensData.length ? { create: itensData } : undefined,
        },
        include: {
          clientes: true,
          itens_os: true,
        },
      });

      await tx.historico_status_os.create({
        data: {
          ordem_servico_id: ordem.id,
          status_anterior: null,
          status_novo: ordem.status,
          alterado_por: currentUser.sub,
          observacao: 'Abertura da OS',
        },
      });

      await this.executeRawIfAvailable(
        tx,
        Prisma.sql`
          UPDATE ordens_servico
          SET criado_por = ${currentUser.sub}::uuid
          WHERE id = ${ordem.id}::uuid
        `,
      );

      await this.createOperationalEvent(tx, {
        ordemId: ordem.id,
        tipo: 'os_criada',
        titulo: 'OS criada',
        descricao: 'Ordem de servico aberta no sistema.',
        usuarioId: currentUser.sub,
      });

      return ordem;
    });

    return this.serializeOrdem(created);
  }

  async update(
    id: string,
    dto: UpdateOrdemServicoDto,
    currentUser: AuthenticatedUser,
  ) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const ordem = await tx.ordens_servico.findUnique({
        where: { id },
        include: { itens_os: true, pagamentos_os: true },
      });

      if (!ordem) {
        throw new NotFoundException('Ordem de serviço não encontrada.');
      }

      if (dto.cliente_id) {
        const cliente = await tx.clientes.findUnique({
          where: { id: dto.cliente_id },
          select: { id: true },
        });

        if (!cliente) {
          throw new NotFoundException('Cliente não encontrado.');
        }
      }

      const itensData =
        dto.itens !== undefined
          ? await this.buildItensData(tx, dto.itens)
          : ordem.itens_os.map((item) => ({
              produto_id: item.produto_id,
              descricao_item: item.descricao_item,
              quantidade: item.quantidade,
              custo_unitario: toNumber(item.custo_unitario) ?? 0,
              venda_unitaria: toNumber(item.venda_unitaria) ?? 0,
              subtotal: toNumber(item.subtotal) ?? 0,
            }));

      const totalPecas = itensData.reduce(
        (acc, item) => acc + item.subtotal,
        0,
      );
      const lucroPecas = itensData.reduce(
        (acc, item) =>
          acc + (item.venda_unitaria - item.custo_unitario) * item.quantidade,
        0,
      );

      const valorMaoDeObra =
        dto.valor_mao_de_obra ?? toNumber(ordem.valor_mao_de_obra) ?? 0;
      const desconto = dto.desconto ?? toNumber(ordem.desconto) ?? 0;
      const valorTotal = totalPecas + valorMaoDeObra - desconto;
      const lucroEstimado = lucroPecas + valorMaoDeObra - desconto;

      const saved = await tx.ordens_servico.update({
        where: { id },
        data: {
          cliente_id: dto.cliente_id ?? undefined,
          atendente_id: dto.atendente_id ?? undefined,
          tecnico_id: dto.tecnico_id ?? undefined,
          aparelho_marca: dto.aparelho_marca ?? undefined,
          aparelho_modelo: dto.aparelho_modelo ?? undefined,
          aparelho_cor: dto.aparelho_cor ?? undefined,
          imei: dto.imei ?? undefined,
          defeito_relatado: dto.defeito_relatado ?? undefined,
          observacoes: dto.observacoes ?? undefined,
          senha_desbloqueio: dto.senha_desbloqueio ?? undefined,
          termo_responsabilidade_aceito:
            dto.termo_responsabilidade_aceito ?? undefined,
          tipo_entrega: dto.tipo_entrega ?? undefined,
          valor_mao_de_obra: valorMaoDeObra,
          desconto,
          valor_total: valorTotal,
          lucro_estimado: lucroEstimado,
          updated_at: new Date(),
          itens_os:
            dto.itens !== undefined
              ? {
                  deleteMany: {},
                  create: itensData,
                }
              : undefined,
        },
        include: {
          clientes: true,
          itens_os: true,
        },
      });

      await this.createOperationalEvent(tx, {
        ordemId: id,
        tipo: 'os_editada',
        titulo: 'OS atualizada',
        descricao: 'Dados da ordem de servico foram atualizados.',
        usuarioId: currentUser.sub,
      });

      return saved;
    });

    return this.serializeOrdem(updated);
  }

  async updateStatus(
    id: string,
    dto: UpdateStatusOrdemServicoDto,
    currentUser: AuthenticatedUser,
  ) {
    const produtosRelacionados = await this.prisma.itens_os.findMany({
      where: { ordem_servico_id: id, produto_id: { not: null } },
      select: { produto_id: true },
    });
    const produtoIds = [
      ...new Set(
        produtosRelacionados
          .map((item) => item.produto_id)
          .filter((item): item is string => Boolean(item)),
      ),
    ];

    const { updated, previousStatus } = await this.prisma.$transaction(
      async (tx) => {
        const ordem = await tx.ordens_servico.findUnique({
          where: { id },
          include: { itens_os: true, pagamentos_os: true },
        });

        if (!ordem) {
          throw new NotFoundException('Ordem de serviço não encontrada.');
        }

        const previousStatus = ordem.status;
        const nextStatus = dto.status;

        const itensComProduto = ordem.itens_os.filter(
          (item): item is typeof item & { produto_id: string } =>
            Boolean(item.produto_id),
        );

        await this.ensureStockConsumedIfNeeded(tx, {
          ordemId: ordem.id,
          nextStatus,
          itens: itensComProduto.map((item) => ({
            produtoId: item.produto_id,
            quantidade: item.quantidade,
          })),
        });

        const dataSaida =
          (nextStatus === status_ordem_servico.entregue ||
            nextStatus === status_ordem_servico.cancelada) &&
          !ordem.data_saida
            ? new Date()
            : ordem.data_saida;

        const saved = await tx.ordens_servico.update({
          where: { id: ordem.id },
          data: {
            status: nextStatus,
            data_saida: dataSaida,
            updated_at: new Date(),
          },
          include: { clientes: true, itens_os: true },
        });

        const saldoPendente = this.getSaldoPendente(ordem);

        if (nextStatus === status_ordem_servico.entregue && saldoPendente > 0) {
          if (!dto.meio_pagamento) {
            throw new BadRequestException(
              'Informe a forma de pagamento para concluir a entrega da OS.',
            );
          }

          await tx.pagamentos_os.create({
            data: {
              ordem_servico_id: ordem.id,
              valor: new Prisma.Decimal(saldoPendente),
              meio: dto.meio_pagamento,
              status: status_pagamento.pago,
              pago_em: new Date(),
              observacao:
                dto.observacao ?? 'Pagamento registrado na entrega da OS.',
            },
          });

          await this.executeRawIfAvailable(
            tx,
            Prisma.sql`
              UPDATE pagamentos_os
              SET registrado_por = ${currentUser.sub}::uuid
              WHERE ordem_servico_id = ${ordem.id}::uuid
                AND registrado_por IS NULL
            `,
          );

          await this.createOperationalEvent(tx, {
            ordemId: ordem.id,
            tipo: 'pagamento_registrado',
            titulo: 'Pagamento registrado',
            descricao:
              dto.observacao ?? 'Pagamento registrado na entrega da OS.',
            usuarioId: currentUser.sub,
            metadados: {
              valor: saldoPendente,
              meio_pagamento: dto.meio_pagamento,
            },
          });
        }

        await tx.historico_status_os.create({
          data: {
            ordem_servico_id: ordem.id,
            status_anterior: previousStatus,
            status_novo: nextStatus,
            alterado_por: dto.alterado_por ?? currentUser.sub,
            observacao: dto.observacao ?? null,
          },
        });

        if (nextStatus === status_ordem_servico.entregue) {
          await this.executeRawIfAvailable(
            tx,
            Prisma.sql`
              UPDATE ordens_servico
              SET entregue_por = ${currentUser.sub}::uuid
              WHERE id = ${ordem.id}::uuid
            `,
          );
        }

        await this.createOperationalEvent(tx, {
          ordemId: ordem.id,
          tipo: 'status_alterado',
          titulo: `Status alterado para ${nextStatus}`,
          descricao: dto.observacao ?? null,
          usuarioId: currentUser.sub,
          metadados: {
            status_anterior: previousStatus,
            status_novo: nextStatus,
          },
        });

        return {
          updated: saved,
          previousStatus,
        };
      },
    );

    await this.notificacoesService.notifyOrderStatusChanged({
      ordemId: updated.id,
      clienteNome: updated.clientes?.nome ?? 'Cliente nao informado',
      status: updated.status,
    });

    if (produtoIds.length) {
      const produtos = await this.prisma.produtos_pecas.findMany({
        where: { id: { in: produtoIds } },
        select: {
          id: true,
          nome: true,
          quantidade_estoque: true,
          estoque_minimo: true,
        },
      });

      await Promise.all(
        produtos.map((produto) =>
          this.notificacoesService.notifyStockStatus({
            produtoId: produto.id,
            nome: produto.nome,
            quantidade: produto.quantidade_estoque,
            estoqueMinimo: produto.estoque_minimo,
          }),
        ),
      );
    }

    if (
      previousStatus !== updated.status &&
      updated.status === status_ordem_servico.pronto_para_retirada &&
      updated.clientes
    ) {
      await this.webhookEventosService.dispatchOrdemServicoPronta(
        {
          ordemId: updated.id,
          clienteNome: updated.clientes.nome,
          clienteTelefone: updated.clientes.telefone,
          tipoEntrega: updated.tipo_entrega,
          aparelhoMarca: updated.aparelho_marca,
          aparelhoModelo: updated.aparelho_modelo,
        },
        {
          initiatedByUserId: currentUser.sub,
          source: 'status_change',
        },
      );
    }

    const webhookState =
      await this.webhookEventosService.getOrderWebhookState(id);
    return this.serializeOrdem(updated, webhookState);
  }

  private serializeOrdem<
    T extends {
      valor_mao_de_obra: Prisma.Decimal | number | string | null;
      desconto: Prisma.Decimal | number | string | null;
      valor_total: Prisma.Decimal | number | string | null;
      lucro_estimado: Prisma.Decimal | number | string | null;
      itens_os?: Array<{
        custo_unitario: Prisma.Decimal | number | string | null;
        venda_unitaria: Prisma.Decimal | number | string | null;
        subtotal: Prisma.Decimal | number | string | null;
      }>;
    },
  >(
    ordem: T,
    webhookState?: {
      configured: boolean;
      status:
        | 'nunca_configurado'
        | 'nao_enviado'
        | 'enviado'
        | 'pendente_reenvio';
      attempts: number;
      latestAttemptAt: Date | null;
      latestResponse: string | null;
      sentSuccessfully: boolean;
    },
  ) {
    const ordemComPagamentos = ordem as T & {
      pagamentos_os?: Array<{
        valor: Prisma.Decimal | number | string | null;
        status: status_pagamento;
      }>;
    };

    const saldoPendente =
      Array.isArray(ordemComPagamentos.pagamentos_os)
        ? this.getSaldoPendente({
            valor_total: ordemComPagamentos.valor_total,
            pagamentos_os: ordemComPagamentos.pagamentos_os,
          })
        : 0;

    return {
      ...ordem,
      valor_mao_de_obra: toNumber(ordem.valor_mao_de_obra),
      desconto: toNumber(ordem.desconto),
      valor_total: toNumber(ordem.valor_total),
      lucro_estimado: toNumber(ordem.lucro_estimado),
      saldo_pendente: saldoPendente,
      pronto_sem_contato_enviado:
        ('status' in ordem &&
          ordem.status === status_ordem_servico.pronto_para_retirada &&
          webhookState &&
          webhookState.status !== 'enviado') ||
        false,
      webhook_pronto: webhookState ?? null,
      itens_os: (ordem.itens_os ?? []).map((item) => ({
        ...item,
        custo_unitario: toNumber(item.custo_unitario),
        venda_unitaria: toNumber(item.venda_unitaria),
        subtotal: toNumber(item.subtotal),
      })),
    };
  }

  private async createOperationalEvent(
    tx: Prisma.TransactionClient | PrismaService,
    input: {
      ordemId: string;
      tipo: string;
      titulo: string;
      descricao?: string | null;
      usuarioId?: string | null;
      metadados?: Prisma.InputJsonValue;
    },
  ) {
    const descricao = input.descricao ?? null;
    const usuarioId = input.usuarioId ?? null;
    const metadados =
      input.metadados === undefined ? null : JSON.stringify(input.metadados);

    await this.executeRawIfAvailable(
      tx,
      Prisma.sql`
        INSERT INTO ordem_servico_eventos (
          ordem_servico_id,
          tipo,
          titulo,
          descricao,
          usuario_id,
          metadados
        )
        VALUES (
          ${input.ordemId}::uuid,
          ${input.tipo},
          ${input.titulo},
          ${descricao},
          ${usuarioId}::uuid,
          ${metadados}::jsonb
        )
      `,
    );
  }

  private serializeUsuarioResumo(
    usuario:
      | {
          id: string;
          nome: string;
          email: string;
          perfil: string;
        }
      | null
      | undefined,
  ) {
    if (!usuario) {
      return null;
    }

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
    };
  }

  private async getOrderAudit(ordemId: string) {
    const rows = await this.prisma.$queryRaw<
      Array<Record<string, string | null>>
    >`
      SELECT
        os.criado_por,
        os.atendente_id,
        os.tecnico_id,
        os.entregue_por,
        criado.nome AS criado_nome,
        criado.email AS criado_email,
        criado.perfil::text AS criado_perfil,
        atendente.nome AS atendente_nome,
        atendente.email AS atendente_email,
        atendente.perfil::text AS atendente_perfil,
        tecnico.nome AS tecnico_nome,
        tecnico.email AS tecnico_email,
        tecnico.perfil::text AS tecnico_perfil,
        entregue.nome AS entregue_nome,
        entregue.email AS entregue_email,
        entregue.perfil::text AS entregue_perfil
      FROM ordens_servico os
      LEFT JOIN usuarios criado ON criado.id = os.criado_por
      LEFT JOIN usuarios atendente ON atendente.id = os.atendente_id
      LEFT JOIN usuarios tecnico ON tecnico.id = os.tecnico_id
      LEFT JOIN usuarios entregue ON entregue.id = os.entregue_por
      WHERE os.id = ${ordemId}::uuid
    `;

    const row = rows[0];
    if (!row) {
      return null;
    }

    return {
      criado_por: this.mapAuditActor(
        row.criado_por,
        row.criado_nome,
        row.criado_email,
        row.criado_perfil,
      ),
      atendente: this.mapAuditActor(
        row.atendente_id,
        row.atendente_nome,
        row.atendente_email,
        row.atendente_perfil,
      ),
      tecnico: this.mapAuditActor(
        row.tecnico_id,
        row.tecnico_nome,
        row.tecnico_email,
        row.tecnico_perfil,
      ),
      entregue_por: this.mapAuditActor(
        row.entregue_por,
        row.entregue_nome,
        row.entregue_email,
        row.entregue_perfil,
      ),
    };
  }

  private async getOrderTimeline(ordemId: string) {
    const rows = await this.prisma.$queryRaw<
      Array<Record<string, string | null>>
    >`
      SELECT
        e.id,
        e.tipo,
        e.titulo,
        e.descricao,
        e.created_at,
        e.metadados::text AS metadados,
        u.id AS usuario_id,
        u.nome AS usuario_nome,
        u.email AS usuario_email,
        u.perfil::text AS usuario_perfil
      FROM ordem_servico_eventos e
      LEFT JOIN usuarios u ON u.id = e.usuario_id
      WHERE e.ordem_servico_id = ${ordemId}::uuid
      ORDER BY e.created_at DESC
    `;

    return rows.map((row) => ({
      id: row.id,
      tipo: row.tipo,
      titulo: row.titulo,
      descricao: row.descricao,
      created_at: row.created_at,
      usuario: this.mapAuditActor(
        row.usuario_id,
        row.usuario_nome,
        row.usuario_email,
        row.usuario_perfil,
      ),
      metadados: row.metadados
        ? (JSON.parse(row.metadados) as Record<string, unknown>)
        : null,
    }));
  }

  private mapAuditActor(
    id: string | null | undefined,
    nome: string | null | undefined,
    email: string | null | undefined,
    perfil: string | null | undefined,
  ) {
    if (!id || !nome || !email || !perfil) {
      return null;
    }

    return {
      id,
      nome,
      email,
      perfil,
    };
  }

  private async executeRawIfAvailable(
    tx: Prisma.TransactionClient | PrismaService,
    query: Prisma.Sql,
  ) {
    if ('$executeRaw' in tx && typeof tx.$executeRaw === 'function') {
      await tx.$executeRaw(query);
    }
  }

  private async buildItensData(
    tx: Prisma.TransactionClient | PrismaService,
    itens: Array<{
      produto_id?: string;
      descricao_item?: string;
      quantidade: number;
      custo_unitario?: number;
      venda_unitaria?: number;
    }>,
  ) {
    const produtoIds = itens
      .map((item) => item.produto_id)
      .filter((item): item is string => Boolean(item));

    const produtos = produtoIds.length
      ? await tx.produtos_pecas.findMany({
          where: { id: { in: produtoIds }, ativo: true },
        })
      : [];

    const produtoPorId = new Map(
      produtos.map((produto) => [produto.id, produto]),
    );

    return itens.map((item) => {
      const produto = item.produto_id
        ? produtoPorId.get(item.produto_id)
        : null;

      if (item.produto_id && !produto) {
        throw new NotFoundException('Produto não encontrado ou inativo.');
      }

      const custoUnitario =
        item.custo_unitario ?? toNumber(produto?.preco_custo) ?? 0;
      const vendaUnitaria =
        item.venda_unitaria ?? toNumber(produto?.preco_venda) ?? 0;
      const descricaoItem = item.descricao_item ?? produto?.nome ?? 'Item';

      return {
        produto_id: item.produto_id ?? null,
        descricao_item: descricaoItem,
        quantidade: item.quantidade,
        custo_unitario: custoUnitario,
        venda_unitaria: vendaUnitaria,
        subtotal: vendaUnitaria * item.quantidade,
      };
    });
  }

  private async ensureStockConsumedIfNeeded(
    tx: Prisma.TransactionClient,
    input: {
      ordemId: string;
      nextStatus: status_ordem_servico;
      itens: Array<{ produtoId: string; quantidade: number }>;
    },
  ) {
    const shouldConsume =
      (
        [
          status_ordem_servico.em_conserto,
          status_ordem_servico.pronto_para_retirada,
          status_ordem_servico.entregue,
        ] as status_ordem_servico[]
      ).includes(input.nextStatus) && input.itens.length > 0;

    if (!shouldConsume) {
      return;
    }

    const qtdNecessariaPorProduto = input.itens.reduce<Record<string, number>>(
      (acc, item) => {
        acc[item.produtoId] = (acc[item.produtoId] ?? 0) + item.quantidade;
        return acc;
      },
      {},
    );

    const consumos = await tx.movimentacoes_estoque.findMany({
      where: {
        tipo: tipo_movimentacao_estoque.saida,
        origem: origem_movimentacao_estoque.ordem_servico,
        origem_id: input.ordemId,
        produto_id: { in: Object.keys(qtdNecessariaPorProduto) },
      },
      select: { produto_id: true, quantidade: true },
    });

    const qtdConsumidaPorProduto = consumos.reduce<Record<string, number>>(
      (acc, mov) => {
        acc[mov.produto_id] = (acc[mov.produto_id] ?? 0) + mov.quantidade;
        return acc;
      },
      {},
    );

    const itensParaConsumir = Object.entries(qtdNecessariaPorProduto)
      .map(([produtoId, quantidade]) => ({
        produtoId,
        quantidade: Math.max(
          0,
          quantidade - (qtdConsumidaPorProduto[produtoId] ?? 0),
        ),
      }))
      .filter((item) => item.quantidade > 0);

    if (itensParaConsumir.length === 0) {
      return;
    }

    const produtos = await tx.produtos_pecas.findMany({
      where: {
        id: { in: itensParaConsumir.map((i) => i.produtoId) },
        ativo: true,
      },
      select: { id: true, quantidade_estoque: true, nome: true },
    });

    const produtoPorId = new Map(produtos.map((p) => [p.id, p]));

    for (const item of itensParaConsumir) {
      const produto = produtoPorId.get(item.produtoId);
      if (!produto) {
        throw new NotFoundException('Produto não encontrado ou inativo.');
      }

      if (produto.quantidade_estoque < item.quantidade) {
        throw new BadRequestException(
          `Estoque insuficiente para o produto "${produto.nome}".`,
        );
      }
    }

    await Promise.all(
      itensParaConsumir.map((item) =>
        tx.produtos_pecas.update({
          where: { id: item.produtoId },
          data: { quantidade_estoque: { decrement: item.quantidade } },
        }),
      ),
    );

    await tx.movimentacoes_estoque.createMany({
      data: itensParaConsumir.map((item) => ({
        produto_id: item.produtoId,
        tipo: tipo_movimentacao_estoque.saida,
        origem: origem_movimentacao_estoque.ordem_servico,
        origem_id: input.ordemId,
        quantidade: item.quantidade,
        observacao: 'Baixa automática de estoque via OS.',
      })),
    });
  }

  private getSaldoPendente(ordem: {
    valor_total: Prisma.Decimal | number | string | null;
    pagamentos_os: Array<{
      valor: Prisma.Decimal | number | string | null;
      status: status_pagamento;
    }>;
  }) {
    const valorTotal = toNumber(ordem.valor_total) ?? 0;
    const valorPago = ordem.pagamentos_os.reduce((acc, pagamento) => {
      if (pagamento.status !== status_pagamento.pago) {
        return acc;
      }

      return acc + (toNumber(pagamento.valor) ?? 0);
    }, 0);

    return Math.max(0, valorTotal - valorPago);
  }
}
