import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  origem_movimentacao_estoque,
  Prisma,
  status_ordem_servico,
  tipo_movimentacao_estoque,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { toNumber } from '../../common/utils/serialize';
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
      throw new NotFoundException('Ordem de serviço não encontrada.');
    }

    return this.serializeOrdem(ordem);
  }

  async create(dto: CreateOrdemServicoDto) {
    return this.prisma.$transaction(async (tx) => {
      const cliente = await tx.clientes.findUnique({
        where: { id: dto.cliente_id },
        select: { id: true },
      });

      if (!cliente) {
        throw new NotFoundException('Cliente não encontrado.');
      }

      const itensPreparados = await Promise.all(
        (dto.itens ?? []).map((item) => this.prepareItem(tx, item)),
      );

      const valorMaoDeObra = dto.valor_mao_de_obra ?? 0;
      const desconto = dto.desconto ?? 0;
      const totalItens = itensPreparados.reduce(
        (acc, item) => acc + item.subtotal,
        0,
      );
      const lucroItens = itensPreparados.reduce(
        (acc, item) => acc + item.lucro,
        0,
      );
      const valorTotal = Math.max(totalItens + valorMaoDeObra - desconto, 0);
      const lucroEstimado = Math.max(lucroItens + valorMaoDeObra - desconto, 0);

      const ordem = await tx.ordens_servico.create({
        data: {
          cliente_id: dto.cliente_id,
          atendente_id: dto.atendente_id,
          tecnico_id: dto.tecnico_id,
          aparelho_marca: dto.aparelho_marca,
          aparelho_modelo: dto.aparelho_modelo,
          aparelho_cor: dto.aparelho_cor,
          imei: dto.imei,
          defeito_relatado: dto.defeito_relatado,
          observacoes: dto.observacoes,
          senha_desbloqueio: dto.senha_desbloqueio,
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

        if (item.produtoId) {
          await tx.produtos_pecas.update({
            where: { id: item.produtoId },
            data: {
              quantidade_estoque: {
                decrement: item.quantidade,
              },
            },
          });

          await tx.movimentacoes_estoque.create({
            data: {
              produto_id: item.produtoId,
              tipo: tipo_movimentacao_estoque.saida,
              origem: origem_movimentacao_estoque.ordem_servico,
              origem_id: ordem.id,
              quantidade: item.quantidade,
              custo_unitario: item.custoUnitario,
              observacao: 'Saída automática por item vinculado à ordem de serviço.',
            },
          });
        }
      }

      await tx.historico_status_os.create({
        data: {
          ordem_servico_id: ordem.id,
          status_novo: status_ordem_servico.aguardando_orcamento,
          alterado_por: dto.atendente_id,
          observacao: 'Ordem de serviço criada.',
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

  async updateStatus(id: string, dto: UpdateStatusOrdemServicoDto) {
    return this.prisma.$transaction(async (tx) => {
      const ordem = await tx.ordens_servico.findUnique({
        where: { id },
      });

      if (!ordem) {
        throw new NotFoundException('Ordem de serviço não encontrada.');
      }

      const atualizada = await tx.ordens_servico.update({
        where: { id },
        data: {
          status: dto.status,
          data_saida:
            dto.status === status_ordem_servico.entregue ? new Date() : ordem.data_saida,
        },
      });

      await tx.historico_status_os.create({
        data: {
          ordem_servico_id: atualizada.id,
          status_anterior: ordem.status,
          status_novo: dto.status,
          alterado_por: dto.alterado_por,
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
        throw new NotFoundException('Produto informado para a OS não foi encontrado.');
      }

      if (produto.quantidade_estoque < item.quantidade) {
        throw new BadRequestException(
          `Estoque insuficiente para o produto ${produto.nome}.`,
        );
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
        'Itens sem produto exigem descrição, custo unitário e venda unitária.',
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

  private serializeOrdem(ordem: OrdemServicoCompleta) {
    return {
      ...ordem,
      valor_mao_de_obra: toNumber(ordem.valor_mao_de_obra),
      desconto: toNumber(ordem.desconto),
      valor_total: toNumber(ordem.valor_total),
      lucro_estimado: toNumber(ordem.lucro_estimado),
      cliente: ordem.clientes,
      itens: ordem.itens_os.map((item) => ({
        ...item,
        custo_unitario: toNumber(item.custo_unitario),
        venda_unitaria: toNumber(item.venda_unitaria),
        subtotal: toNumber(item.subtotal),
      })),
      historico: ordem.historico_status_os,
    };
  }
}
