import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  meio_pagamento,
  Prisma,
  status_ordem_servico,
  status_pagamento,
  tipo_entrega_os,
} from '@prisma/client';
import { OrdensServicoService } from './ordens-servico.service';

const createNotificationServiceMock = () => ({
  notifyOrderStatusChanged: jest.fn(),
  notifyStockStatus: jest.fn(),
});

const createWebhookServiceMock = () => ({
  dispatchOrdemServicoPronta: jest.fn(),
});

const currentUser = {
  sub: 'user-1',
  nome: 'Admin',
  email: 'admin@loja.local',
  perfil: 'administrador' as const,
};

type TransactionCallback<TX, TResult> = (tx: TX) => Promise<TResult>;

type ProdutoMock = {
  id: string;
  nome: string;
  preco_custo?: Prisma.Decimal;
  preco_venda?: Prisma.Decimal;
  quantidade_estoque?: number;
  estoque_minimo?: number;
  ativo?: boolean;
};

type OrdemServicoResumoMock = {
  id: string;
  status: status_ordem_servico;
  valor_total: Prisma.Decimal;
  pagamentos_os: Array<{ valor?: Prisma.Decimal }>;
  itens_os: Array<{ produto_id: string | null; quantidade?: number }>;
  data_saida: Date | null;
};

type OrdemServicoAtualizadaMock = {
  id: string;
  status: status_ordem_servico;
  clientes: { nome: string; telefone: string };
  itens_os: Array<{
    produto_id: string | null;
    quantidade: number;
    custo_unitario: Prisma.Decimal;
    venda_unitaria: Prisma.Decimal;
    subtotal: Prisma.Decimal;
  }>;
  valor_mao_de_obra: Prisma.Decimal;
  desconto: Prisma.Decimal;
  valor_total: Prisma.Decimal;
  lucro_estimado: Prisma.Decimal;
  tipo_entrega: tipo_entrega_os;
  aparelho_marca: string;
  aparelho_modelo: string;
};

type OrdemServicoCreateData = {
  cliente_id: string;
  aparelho_marca: string;
  aparelho_modelo: string;
  valor_mao_de_obra: number;
  desconto: number;
  valor_total: number;
  lucro_estimado: number;
  tipo_entrega: 'retirada_loja' | 'entrega';
  status: status_ordem_servico;
  itens_os?: {
    create: Array<{
      produto_id: string | null;
      descricao_item: string;
      quantidade: number;
      custo_unitario: number;
      venda_unitaria: number;
      subtotal: number;
    }>;
  };
};

type PagamentoCreateArgs = {
  data: {
    valor: Prisma.Decimal;
    meio: meio_pagamento;
    status: status_pagamento;
  };
};

const requirePagamentoCreateArgs = (
  value: PagamentoCreateArgs | null,
): PagamentoCreateArgs => {
  if (!value) {
    throw new Error('Pagamento automatico nao foi registrado.');
  }

  return value;
};

describe('OrdensServicoService', () => {
  it('calcula valor total e lucro estimado ao criar OS', async () => {
    const prisma = {
      clientes: {
        findUnique: jest.fn().mockResolvedValue({ id: 'cliente-1' }),
      },
      produtos_pecas: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'produto-1',
            nome: 'Tela OLED',
            preco_custo: new Prisma.Decimal(100),
            preco_venda: new Prisma.Decimal(180),
          },
        ]),
      },
      $transaction: jest.fn(),
    };

    const tx = {
      ordens_servico: {
        create: jest
          .fn()
          .mockImplementation(({ data }: { data: OrdemServicoCreateData }) => ({
            id: 'os-1',
            clientes: { nome: 'Maria', telefone: '(11) 99999-9999' },
            itens_os: data.itens_os?.create ?? [],
            valor_mao_de_obra: data.valor_mao_de_obra,
            desconto: data.desconto,
            valor_total: data.valor_total,
            lucro_estimado: data.lucro_estimado,
            tipo_entrega: data.tipo_entrega,
            status: data.status,
            aparelho_marca: data.aparelho_marca,
            aparelho_modelo: data.aparelho_modelo,
            cliente_id: data.cliente_id,
          })),
      },
      historico_status_os: {
        create: jest.fn(),
      },
      produtos_pecas: prisma.produtos_pecas,
    };

    prisma.$transaction.mockImplementation(
      (callback: TransactionCallback<typeof tx, unknown>) => callback(tx),
    );

    const service = new OrdensServicoService(
      prisma as never,
      createNotificationServiceMock() as never,
      createWebhookServiceMock() as never,
    );

    const result = await service.create(
      {
        cliente_id: 'cliente-1',
        aparelho_marca: 'Apple',
        aparelho_modelo: 'iPhone 13',
        defeito_relatado: 'Tela quebrada',
        termo_responsabilidade_aceito: true,
        valor_mao_de_obra: 50,
        desconto: 10,
        itens: [
          {
            produto_id: 'produto-1',
            quantidade: 2,
          },
        ],
      },
      currentUser,
    );

    expect(result.valor_total).toBe(400);
    expect(result.lucro_estimado).toBe(200);
    expect(tx.historico_status_os.create).toHaveBeenCalled();
  });

  it('exige meio de pagamento ao entregar OS com saldo pendente', async () => {
    const prisma = {
      itens_os: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn(),
    };

    const tx = {
      ordens_servico: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'os-1',
          status: status_ordem_servico.pronto_para_retirada,
          valor_total: new Prisma.Decimal(150),
          pagamentos_os: [],
          itens_os: [],
          data_saida: null,
        } satisfies OrdemServicoResumoMock),
        update: jest.fn().mockResolvedValue({
          id: 'os-1',
          status: status_ordem_servico.entregue,
          clientes: { nome: 'Maria', telefone: '(11) 99999-9999' },
          itens_os: [],
          valor_mao_de_obra: new Prisma.Decimal(0),
          desconto: new Prisma.Decimal(0),
          valor_total: new Prisma.Decimal(150),
          lucro_estimado: new Prisma.Decimal(150),
          tipo_entrega: tipo_entrega_os.retirada_loja,
          aparelho_marca: 'Apple',
          aparelho_modelo: 'iPhone 13',
        } satisfies OrdemServicoAtualizadaMock),
      },
      pagamentos_os: { create: jest.fn() },
      historico_status_os: { create: jest.fn() },
    };

    prisma.$transaction.mockImplementation(
      (callback: TransactionCallback<typeof tx, unknown>) => callback(tx),
    );

    const service = new OrdensServicoService(
      prisma as never,
      createNotificationServiceMock() as never,
      createWebhookServiceMock() as never,
    );

    await expect(
      service.updateStatus(
        'os-1',
        { status: status_ordem_servico.entregue },
        currentUser,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('registra pagamento automaticamente ao entregar OS com saldo pendente', async () => {
    let pagamentoRegistrado: PagamentoCreateArgs | null = null;
    const pagamentoCreateMock = jest.fn<void, [PagamentoCreateArgs]>();
    pagamentoCreateMock.mockImplementation((args) => {
      pagamentoRegistrado = args;
    });

    const prisma = {
      itens_os: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn(),
      produtos_pecas: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const tx = {
      ordens_servico: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'os-1',
          status: status_ordem_servico.pronto_para_retirada,
          valor_total: new Prisma.Decimal(150),
          pagamentos_os: [],
          itens_os: [],
          data_saida: null,
        } satisfies OrdemServicoResumoMock),
        update: jest.fn().mockResolvedValue({
          id: 'os-1',
          status: status_ordem_servico.entregue,
          clientes: { nome: 'Maria', telefone: '(11) 99999-9999' },
          itens_os: [],
          valor_mao_de_obra: new Prisma.Decimal(0),
          desconto: new Prisma.Decimal(0),
          valor_total: new Prisma.Decimal(150),
          lucro_estimado: new Prisma.Decimal(150),
          tipo_entrega: tipo_entrega_os.retirada_loja,
          aparelho_marca: 'Apple',
          aparelho_modelo: 'iPhone 13',
        } satisfies OrdemServicoAtualizadaMock),
      },
      pagamentos_os: {
        create: pagamentoCreateMock,
      },
      historico_status_os: {
        create: jest.fn(),
      },
      movimentacoes_estoque: {
        findMany: jest.fn().mockResolvedValue([]),
        createMany: jest.fn(),
      },
      produtos_pecas: {
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
      },
    };

    prisma.$transaction.mockImplementation(
      (callback: TransactionCallback<typeof tx, unknown>) => callback(tx),
    );

    const notificacoesService = createNotificationServiceMock();
    const service = new OrdensServicoService(
      prisma as never,
      notificacoesService as never,
      createWebhookServiceMock() as never,
    );

    await service.updateStatus(
      'os-1',
      {
        status: status_ordem_servico.entregue,
        meio_pagamento: meio_pagamento.pix,
      },
      currentUser,
    );

    expect(pagamentoCreateMock).toHaveBeenCalled();
    expect(pagamentoRegistrado).not.toBeNull();
    const pagamentoCriado = requirePagamentoCreateArgs(pagamentoRegistrado);

    expect(pagamentoCriado.data.valor).toEqual(new Prisma.Decimal(150));
    expect(pagamentoCriado.data.meio).toBe(meio_pagamento.pix);
    expect(pagamentoCriado.data.status).toBe(status_pagamento.pago);
    expect(notificacoesService.notifyOrderStatusChanged).toHaveBeenCalled();
  });

  it('consome estoque quando a OS entra em etapa operacional', async () => {
    const prisma = {
      itens_os: {
        findMany: jest.fn().mockResolvedValue([{ produto_id: 'produto-1' }]),
      },
      $transaction: jest.fn(),
      produtos_pecas: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'produto-1',
            nome: 'Tela OLED',
            quantidade_estoque: 3,
            estoque_minimo: 1,
          },
        ] satisfies ProdutoMock[]),
      },
    };

    const tx = {
      ordens_servico: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'os-1',
          status: status_ordem_servico.aguardando_peca,
          valor_total: new Prisma.Decimal(200),
          pagamentos_os: [],
          itens_os: [{ produto_id: 'produto-1', quantidade: 2 }],
          data_saida: null,
        } satisfies OrdemServicoResumoMock),
        update: jest.fn().mockResolvedValue({
          id: 'os-1',
          status: status_ordem_servico.em_conserto,
          clientes: { nome: 'João', telefone: '(11) 99999-9999' },
          itens_os: [
            {
              produto_id: 'produto-1',
              quantidade: 2,
              custo_unitario: new Prisma.Decimal(100),
              venda_unitaria: new Prisma.Decimal(200),
              subtotal: new Prisma.Decimal(400),
            },
          ],
          valor_mao_de_obra: new Prisma.Decimal(0),
          desconto: new Prisma.Decimal(0),
          valor_total: new Prisma.Decimal(200),
          lucro_estimado: new Prisma.Decimal(200),
          tipo_entrega: tipo_entrega_os.retirada_loja,
          aparelho_marca: 'Samsung',
          aparelho_modelo: 'S23',
        } satisfies OrdemServicoAtualizadaMock),
      },
      pagamentos_os: {
        create: jest.fn(),
      },
      historico_status_os: {
        create: jest.fn(),
      },
      movimentacoes_estoque: {
        findMany: jest.fn().mockResolvedValue([]),
        createMany: jest.fn(),
      },
      produtos_pecas: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { id: 'produto-1', quantidade_estoque: 5, nome: 'Tela OLED' },
          ] satisfies ProdutoMock[]),
        update: jest.fn(),
      },
    };

    prisma.$transaction.mockImplementation(
      (callback: TransactionCallback<typeof tx, unknown>) => callback(tx),
    );

    const service = new OrdensServicoService(
      prisma as never,
      createNotificationServiceMock() as never,
      createWebhookServiceMock() as never,
    );

    await service.updateStatus(
      'os-1',
      { status: status_ordem_servico.em_conserto },
      currentUser,
    );

    expect(tx.produtos_pecas.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'produto-1' },
        data: { quantidade_estoque: { decrement: 2 } },
      }),
    );
    expect(tx.movimentacoes_estoque.createMany).toHaveBeenCalled();
  });

  it('falha ao criar OS com produto inexistente ou inativo', async () => {
    const prisma = {
      clientes: {
        findUnique: jest.fn().mockResolvedValue({ id: 'cliente-1' }),
      },
      produtos_pecas: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const service = new OrdensServicoService(
      prisma as never,
      createNotificationServiceMock() as never,
      createWebhookServiceMock() as never,
    );

    await expect(
      service.create(
        {
          cliente_id: 'cliente-1',
          aparelho_marca: 'Apple',
          aparelho_modelo: 'iPhone 13',
          defeito_relatado: 'Tela quebrada',
          termo_responsabilidade_aceito: true,
          itens: [{ produto_id: 'produto-inexistente', quantidade: 1 }],
        },
        currentUser,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
