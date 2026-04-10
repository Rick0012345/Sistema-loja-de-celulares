import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  meio_pagamento,
  Prisma,
  status_pagamento,
  tipo_conta_financeira,
} from '@prisma/client';
import { VendasService } from './vendas.service';

const createNotificationServiceMock = () => ({
  notifyStockStatus: jest.fn(),
  notifySaleRegistered: jest.fn(),
});

type TransactionCallback<TX, TResult> = (tx: TX) => Promise<TResult>;

type ProdutoVendaMock = {
  id: string;
  nome: string;
  ativo: boolean;
  quantidade_estoque: number;
  preco_custo: Prisma.Decimal;
  preco_venda: Prisma.Decimal;
};

type ContaFinanceiraCreateArgs = {
  data: {
    tipo: tipo_conta_financeira;
    status: status_pagamento;
    valor: Prisma.Decimal;
  };
};

const requireContaFinanceiraCreateArgs = (
  value: ContaFinanceiraCreateArgs | null,
): ContaFinanceiraCreateArgs => {
  if (!value) {
    throw new Error('Conta financeira nao foi registrada.');
  }

  return value;
};

describe('VendasService', () => {
  it('registra venda com baixa de estoque e conta financeira paga', async () => {
    let contaFinanceiraCriada: ContaFinanceiraCreateArgs | null = null;
    const contaFinanceiraCreateMock = jest.fn<
      void,
      [ContaFinanceiraCreateArgs]
    >();
    contaFinanceiraCreateMock.mockImplementation((args) => {
      contaFinanceiraCriada = args;
    });

    const prisma = {
      produtos_pecas: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'produto-1',
            nome: 'Pelicula',
            ativo: true,
            quantidade_estoque: 5,
            preco_custo: new Prisma.Decimal(10),
            preco_venda: new Prisma.Decimal(25),
          },
        ] satisfies ProdutoVendaMock[]),
      },
      $transaction: jest.fn(),
    };

    const tx = {
      produtos_pecas: {
        update: jest.fn().mockResolvedValue({
          id: 'produto-1',
          nome: 'Pelicula',
          quantidade_estoque: 3,
          estoque_minimo: 1,
        }),
      },
      movimentacoes_estoque: {
        createMany: jest.fn(),
      },
      contas_financeiras: {
        create: contaFinanceiraCreateMock,
      },
    };

    prisma.$transaction.mockImplementation(
      (callback: TransactionCallback<typeof tx, unknown>) => callback(tx),
    );

    const notificacoesService = createNotificationServiceMock();
    const service = new VendasService(
      prisma as never,
      notificacoesService as never,
    );

    const result = await service.create({
      cliente_nome: 'Maria',
      meio_pagamento: meio_pagamento.pix,
      itens: [{ produto_id: 'produto-1', quantidade: 2 }],
    });

    expect(result.valor_total).toBe(50);
    expect(tx.movimentacoes_estoque.createMany).toHaveBeenCalled();
    expect(contaFinanceiraCreateMock).toHaveBeenCalled();
    expect(contaFinanceiraCriada).not.toBeNull();
    const contaRegistrada = requireContaFinanceiraCreateArgs(
      contaFinanceiraCriada,
    );

    expect(contaRegistrada.data.tipo).toBe(tipo_conta_financeira.receber);
    expect(contaRegistrada.data.status).toBe(status_pagamento.pago);
    expect(contaRegistrada.data.valor).toEqual(new Prisma.Decimal(50));
    expect(notificacoesService.notifySaleRegistered).toHaveBeenCalled();
  });

  it('impede venda quando a quantidade solicitada excede o estoque', async () => {
    const prisma = {
      produtos_pecas: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'produto-1',
            nome: 'Pelicula',
            ativo: true,
            quantidade_estoque: 1,
            preco_custo: new Prisma.Decimal(10),
            preco_venda: new Prisma.Decimal(25),
          },
        ] satisfies ProdutoVendaMock[]),
      },
    };

    const service = new VendasService(
      prisma as never,
      createNotificationServiceMock() as never,
    );

    await expect(
      service.create({
        cliente_nome: 'Maria',
        meio_pagamento: meio_pagamento.pix,
        itens: [{ produto_id: 'produto-1', quantidade: 2 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('falha quando o produto da venda nao existe ou esta inativo', async () => {
    const prisma = {
      produtos_pecas: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const service = new VendasService(
      prisma as never,
      createNotificationServiceMock() as never,
    );

    await expect(
      service.create({
        cliente_nome: 'Maria',
        meio_pagamento: meio_pagamento.pix,
        itens: [{ produto_id: 'produto-1', quantidade: 1 }],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
