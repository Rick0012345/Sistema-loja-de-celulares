import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  origem_movimentacao_estoque,
  status_ordem_servico,
  tipo_movimentacao_estoque,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { toNumber } from '../../common/utils/serialize';
import type { AuthenticatedUser } from '../auth/auth.types';
import type {
  CreateOrdemServicoDto,
  UpdateOrdemServicoDto,
  UpdateStatusOrdemServicoDto,
} from './ordens-servico.dto';

@Injectable()
export class OrdensServicoService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const ordens = await this.prisma.ordens_servico.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        clientes: true,
        itens_os: true,
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
        pagamentos_os: {
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!ordem) {
      throw new NotFoundException('Ordem de serviço não encontrada.');
    }

    return {
      ...this.serializeOrdem(ordem),
      historico_status_os: ordem.historico_status_os,
      pagamentos_os: ordem.pagamentos_os.map((pagamento) => ({
        ...pagamento,
        valor: toNumber(pagamento.valor),
      })),
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

      return ordem;
    });

    return this.serializeOrdem(created);
  }

  async update(id: string, dto: UpdateOrdemServicoDto) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const ordem = await tx.ordens_servico.findUnique({
        where: { id },
        include: { itens_os: true },
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

      const totalPecas = itensData.reduce((acc, item) => acc + item.subtotal, 0);
      const lucroPecas = itensData.reduce(
        (acc, item) =>
          acc + (item.venda_unitaria - item.custo_unitario) * item.quantidade,
        0,
      );

      const valorMaoDeObra =
        dto.valor_mao_de_obra ?? (toNumber(ordem.valor_mao_de_obra) ?? 0);
      const desconto = dto.desconto ?? (toNumber(ordem.desconto) ?? 0);
      const valorTotal = totalPecas + valorMaoDeObra - desconto;
      const lucroEstimado = lucroPecas + valorMaoDeObra - desconto;

      return tx.ordens_servico.update({
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
    });

    return this.serializeOrdem(updated);
  }

  async updateStatus(
    id: string,
    dto: UpdateStatusOrdemServicoDto,
    currentUser: AuthenticatedUser,
  ) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const ordem = await tx.ordens_servico.findUnique({
        where: { id },
        include: { itens_os: true },
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

      await tx.historico_status_os.create({
        data: {
          ordem_servico_id: ordem.id,
          status_anterior: previousStatus,
          status_novo: nextStatus,
          alterado_por: dto.alterado_por ?? currentUser.sub,
          observacao: dto.observacao ?? null,
        },
      });

      return saved;
    });

    return this.serializeOrdem(updated);
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
  >(ordem: T) {
    return {
      ...ordem,
      valor_mao_de_obra: toNumber(ordem.valor_mao_de_obra),
      desconto: toNumber(ordem.desconto),
      valor_total: toNumber(ordem.valor_total),
      lucro_estimado: toNumber(ordem.lucro_estimado),
      itens_os: (ordem.itens_os ?? []).map((item) => ({
        ...item,
        custo_unitario: toNumber(item.custo_unitario),
        venda_unitaria: toNumber(item.venda_unitaria),
        subtotal: toNumber(item.subtotal),
      })),
    };
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

    const produtoPorId = new Map(produtos.map((produto) => [produto.id, produto]));

    return itens.map((item) => {
      const produto = item.produto_id ? produtoPorId.get(item.produto_id) : null;

      if (item.produto_id && !produto) {
        throw new NotFoundException('Produto não encontrado ou inativo.');
      }

      const custoUnitario =
        item.custo_unitario ?? (toNumber(produto?.preco_custo) ?? 0);
      const vendaUnitaria =
        item.venda_unitaria ?? (toNumber(produto?.preco_venda) ?? 0);
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
}
