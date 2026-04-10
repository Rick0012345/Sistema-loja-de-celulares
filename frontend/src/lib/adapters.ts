import {
  AuthStatus,
  AuthenticatedUser,
  Customer,
  DashboardSummary,
  FinancialReport,
  NotificationItem,
  NotificationSeverity,
  NotificationType,
  PaymentMethod,
  Product,
  ProfessionalOperationPanel,
  Sale,
  ServiceOrder,
  ServiceOrderActor,
  ServiceOrderWebhook,
  Supplier,
  ServiceStatus,
} from '../types';

type ApiProduct = {
  id: string;
  nome: string;
  marca?: string | null;
  modelo_compatavel?: string | null;
  categoria_id?: string | null;
  categorias_produto?:
    | {
        id: string;
        nome: string;
      }
    | null;
  sku?: string | null;
  preco_custo: number;
  preco_venda: number;
  quantidade_estoque: number;
  estoque_minimo: number;
  estoque_baixo?: boolean;
  fornecedor_preferencial?: {
    id: string;
    nome: string;
    telefone?: string | null;
    whatsapp?: string | null;
    cidade?: string | null;
    ativo: boolean;
  } | null;
};

type ApiCustomer = {
  id: string;
  nome: string;
  telefone: string;
  email?: string | null;
  cpf?: string | null;
};

type ApiServiceItem = {
  id: string;
  produto_id?: string | null;
  descricao_item: string;
  quantidade: number;
  custo_unitario: number;
  venda_unitaria: number;
  subtotal: number;
};

type ApiServiceOrder = {
  id: string;
  cliente_id: string;
  cliente?: ApiCustomer;
  clientes?: ApiCustomer;
  aparelho_marca: string;
  aparelho_modelo: string;
  defeito_relatado: string;
  tipo_entrega?: 'retirada_loja' | 'entrega';
  status: string;
  valor_mao_de_obra: number;
  valor_total: number;
  lucro_estimado: number;
  saldo_pendente?: number;
  pronto_sem_contato_enviado?: boolean;
  webhook_pronto?: ApiWebhookState | null;
  auditoria?: {
    criado_por?: ApiActor | null;
    atendente?: ApiActor | null;
    tecnico?: ApiActor | null;
    entregue_por?: ApiActor | null;
  };
  timeline?: ApiTimelineItem[];
  created_at: string;
  updated_at: string;
  itens?: ApiServiceItem[];
  itens_os?: ApiServiceItem[];
};

type ApiActor = {
  id: string;
  nome: string;
  email: string;
  perfil: ServiceOrderActor['perfil'];
};

type ApiTimelineItem = {
  id: string;
  tipo: string;
  titulo: string;
  descricao?: string | null;
  created_at: string;
  usuario?: ApiActor | null;
  metadados?: Record<string, unknown> | null;
};

type ApiWebhookState = {
  configured: boolean;
  status:
    | 'nunca_configurado'
    | 'nao_enviado'
    | 'enviado'
    | 'pendente_reenvio';
  attempts: number;
  latestAttemptAt?: string | null;
  latest_attempt_at?: string | null;
  latestResponse?: string | null;
  latest_response?: string | null;
  sentSuccessfully?: boolean;
  sent_successfully?: boolean;
  history?: Array<{
    id: string;
    evento: string;
    referencia_id: string;
    sucesso: boolean;
    resposta?: string | null;
    created_at: string;
  }>;
};

type ApiDashboardSummary = {
  indicadores: {
    totalClientes: number;
    totalProdutos: number;
    totalOrdensAbertas: number;
    totalProdutosBaixoEstoque: number;
    faturamentoMes: number;
    lucroMes: number;
  };
  ordensRecentes: Array<{
    id: string;
    cliente: string;
    aparelho: string;
    status: string;
    valor_total: number;
    saldo_pendente?: number;
    created_at: string;
  }>;
  produtosBaixoEstoque: Array<{
    id: string;
    nome: string;
    quantidade_estoque: number;
    estoque_minimo: number;
    fornecedor_nome?: string | null;
  }>;
  filaOperacional?: Array<{
    id: string;
    cliente: {
      nome: string;
      telefone: string;
    };
    aparelho: string;
    status: string;
    valor_total: number;
    saldo_pendente: number;
    item_aguardando_fornecedor: boolean;
    pronto_sem_contato_enviado: boolean;
    updated_at: string;
    webhook_pronto?: ApiWebhookState | null;
  }>;
};

type ApiSupplier = {
  id: string;
  nome: string;
  telefone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  documento?: string | null;
  cidade?: string | null;
  observacoes?: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  _count?: {
    produtos_pecas?: number;
    contas_financeiras?: number;
  };
};

type ApiFinancialReport = {
  periodo: {
    dias: number;
    inicio: string;
    origem: 'todas' | 'ordem_servico' | 'venda';
  };
  resumo: {
    faturamento_total: number;
    lucro_total: number;
  };
  porOrigem: {
    ordem_servico: {
      faturamento: number;
      lucro: number;
      quantidade: number;
    };
    venda: {
      faturamento: number;
      lucro: number;
      quantidade: number;
    };
  };
  porFormaPagamento: Record<string, number>;
  itens: Array<{
    id: string;
    origem: 'ordem_servico' | 'venda';
    referencia: string;
    cliente: string;
    descricao: string;
    valor: number;
    lucro: number;
    data: string;
    meio_pagamento?: PaymentMethod | null;
  }>;
};

type ApiProfessionalOperation = {
  alertas: {
    ordens_paradas: Array<{
      id: string;
      cliente: string;
      aparelho: string;
      status: string;
      updated_at: string;
    }>;
    estoque_critico: Array<{
      id: string;
      nome: string;
      quantidade_estoque: number;
      estoque_minimo: number;
      fornecedor_nome?: string | null;
    }>;
    retirada_pendente: Array<{
      id: string;
      cliente: string;
      telefone: string;
      saldo_pendente: number;
      updated_at: string;
    }>;
    integracoes_falhando: Array<{
      ordem_id: string;
      cliente: string;
      status: string;
      webhook_status: string;
      tentativa_em?: string | null;
      resposta?: string | null;
    }>;
  };
  indicadores: {
    ordens_por_tecnico: Array<{
      tecnico_id: string;
      tecnico_nome: string;
      quantidade: number;
    }>;
    ordens_atrasadas: number;
    pecas_mais_consumidas: Array<{
      produto_id: string;
      nome: string;
      fornecedor_nome?: string | null;
      quantidade: number;
    }>;
    gargalos_por_etapa: Array<{
      status: string;
      quantidade: number;
    }>;
  };
  integracoes: {
    enviadas: number;
    pendentesReenvio: number;
    naoEnviadas: number;
    nuncaConfigurado: number;
  };
};

type ApiSaleItem = {
  produto_id: string;
  produto_nome: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
};

type ApiSale = {
  id: string;
  referencia: string;
  cliente_nome: string;
  meio_pagamento: PaymentMethod;
  valor_total: number;
  criado_em: string;
  itens: ApiSaleItem[];
};

type ApiNotification = {
  id: string;
  tipo: NotificationType;
  titulo: string;
  mensagem: string;
  severidade: NotificationSeverity;
  lida: boolean;
  created_at: string;
};

export const mapAuthenticatedUserFromApi = (user: AuthenticatedUser): AuthenticatedUser => user;

export const mapAuthStatusFromApi = (status: AuthStatus): AuthStatus => status;

const STATUS_FROM_API: Record<string, ServiceStatus> = {
  aguardando_orcamento: 'aguardando_orcamento',
  aguardando_aprovacao: 'aguardando_aprovacao',
  aguardando_peca: 'aguardando_peca',
  em_conserto: 'em_conserto',
  pronto_para_retirada: 'pronto_para_retirada',
  entregue: 'entregue',
  cancelada: 'cancelada',
};

const STATUS_TO_API: Record<ServiceStatus, string> = {
  aguardando_orcamento: 'aguardando_orcamento',
  aguardando_aprovacao: 'aguardando_aprovacao',
  aguardando_peca: 'aguardando_peca',
  em_conserto: 'em_conserto',
  pronto_para_retirada: 'pronto_para_retirada',
  entregue: 'entregue',
  cancelada: 'cancelada',
};

const STATUS_LABELS: Record<ServiceStatus, string> = {
  aguardando_orcamento: 'Aguardando orçamento',
  aguardando_aprovacao: 'Aguardando aprovação',
  aguardando_peca: 'Aguardando peça',
  em_conserto: 'Em conserto',
  pronto_para_retirada: 'Pronto para retirada',
  entregue: 'Entregue',
  cancelada: 'Cancelada',
};

const mapInventoryTypeFromCategory = (
  categoryName?: string | null,
): Product['inventoryType'] => {
  const normalized = categoryName?.trim().toLowerCase() ?? '';

  if (normalized === 'venda') {
    return 'sales';
  }

  if (normalized === 'manutencao') {
    return 'repair';
  }

  return 'uncategorized';
};

export const serviceStatusToApi = (status: ServiceStatus) => STATUS_TO_API[status];

export const serviceStatusLabel = (status: ServiceStatus) => STATUS_LABELS[status];

export const mapProductFromApi = (product: ApiProduct): Product => ({
  id: product.id,
  name: product.nome,
  brand: product.marca ?? '',
  compatibleModel: product.modelo_compatavel ?? '',
  sku: product.sku ?? '',
  categoryId: product.categoria_id ?? product.categorias_produto?.id ?? null,
  categoryName: product.categorias_produto?.nome ?? '',
  inventoryType: mapInventoryTypeFromCategory(product.categorias_produto?.nome),
  costPrice: product.preco_custo,
  salePrice: product.preco_venda,
  stock: product.quantidade_estoque,
  minStock: product.estoque_minimo,
  isLowStock:
    product.estoque_baixo ?? product.quantidade_estoque <= product.estoque_minimo,
  preferredSupplier: product.fornecedor_preferencial
    ? {
        id: product.fornecedor_preferencial.id,
        name: product.fornecedor_preferencial.nome,
        phone: product.fornecedor_preferencial.telefone ?? null,
        whatsapp: product.fornecedor_preferencial.whatsapp ?? null,
        city: product.fornecedor_preferencial.cidade ?? null,
        isActive: product.fornecedor_preferencial.ativo,
      }
    : null,
});

export const mapCustomerFromApi = (customer: ApiCustomer): Customer => ({
  id: customer.id,
  name: customer.nome,
  phone: customer.telefone,
  email: customer.email ?? null,
  cpf: customer.cpf ?? null,
});

export const mapServiceFromApi = (service: ApiServiceOrder): ServiceOrder => {
  const customer = service.cliente ?? service.clientes;
  const parts = service.itens ?? service.itens_os ?? [];
  const status = STATUS_FROM_API[service.status] ?? 'aguardando_orcamento';

  return {
    id: service.id,
    customerId: service.cliente_id,
    customerName: customer?.nome ?? 'Cliente não informado',
    customerPhone: customer?.telefone ?? '',
    deviceBrand: service.aparelho_marca,
    deviceModel: service.aparelho_modelo,
    issueDescription: service.defeito_relatado,
    deliveryType: service.tipo_entrega === 'entrega' ? 'delivery' : 'store_pickup',
    status,
    partsUsed: parts.map((item) => ({
      id: item.id,
      productId: item.produto_id ?? null,
      description: item.descricao_item,
      quantity: item.quantidade,
      costPrice: item.custo_unitario,
      salePrice: item.venda_unitaria,
      subtotal: item.subtotal,
    })),
    laborCost: service.valor_mao_de_obra,
    totalPrice: service.valor_total,
    estimatedProfit: service.lucro_estimado,
    pendingBalance: service.saldo_pendente ?? 0,
    readyWithoutContactSent: Boolean(service.pronto_sem_contato_enviado),
    webhookPronto: mapWebhookStateFromApi(service.webhook_pronto),
    audit: service.auditoria
      ? {
          createdBy: mapActorFromApi(service.auditoria.criado_por),
          attendant: mapActorFromApi(service.auditoria.atendente),
          technician: mapActorFromApi(service.auditoria.tecnico),
          deliveredBy: mapActorFromApi(service.auditoria.entregue_por),
        }
      : undefined,
    timeline: service.timeline?.map((item) => ({
      id: item.id,
      type: item.tipo,
      title: item.titulo,
      description: item.descricao ?? null,
      createdAt: item.created_at,
      actor: mapActorFromApi(item.usuario),
      metadata: item.metadados ?? null,
    })),
    createdAt: service.created_at,
    updatedAt: service.updated_at,
  };
};

const mapActorFromApi = (actor?: ApiActor | null): ServiceOrderActor | null => {
  if (!actor) {
    return null;
  }

  return {
    id: actor.id,
    nome: actor.nome,
    email: actor.email,
    perfil: actor.perfil,
  };
};

export const mapWebhookStateFromApi = (
  webhook: ApiWebhookState | null | undefined,
): ServiceOrderWebhook | null => {
  if (!webhook) {
    return null;
  }

  return {
    configured: webhook.configured,
    status: webhook.status,
    attempts: webhook.attempts,
    latestAttemptAt:
      webhook.latestAttemptAt ?? webhook.latest_attempt_at ?? null,
    latestResponse: webhook.latestResponse ?? webhook.latest_response ?? null,
    sentSuccessfully:
      webhook.sentSuccessfully ?? webhook.sent_successfully ?? false,
    history: webhook.history?.map((item) => ({
      id: item.id,
      event: item.evento,
      referenceId: item.referencia_id,
      success: item.sucesso,
      response: item.resposta ?? null,
      createdAt: item.created_at,
    })),
  };
};

export const mapDashboardSummaryFromApi = (
  summary: ApiDashboardSummary,
): DashboardSummary => ({
  indicators: summary.indicadores,
  recentOrders: summary.ordensRecentes.map((order) => ({
    id: order.id,
    customerName: order.cliente,
    deviceLabel: order.aparelho,
    statusLabel:
      STATUS_LABELS[STATUS_FROM_API[order.status] ?? 'aguardando_orcamento'],
    totalPrice: order.valor_total,
    pendingBalance: order.saldo_pendente ?? 0,
    createdAt: order.created_at,
  })),
  lowStockProducts: summary.produtosBaixoEstoque.map((product) => ({
    id: product.id,
    name: product.nome,
    stock: product.quantidade_estoque,
    minStock: product.estoque_minimo,
    supplierName: product.fornecedor_nome ?? null,
  })),
  operationalQueue: (summary.filaOperacional ?? []).map((item) => ({
    id: item.id,
    customerName: item.cliente.nome,
    customerPhone: item.cliente.telefone,
    deviceLabel: item.aparelho,
    status: STATUS_FROM_API[item.status] ?? 'aguardando_orcamento',
    totalPrice: item.valor_total,
    pendingBalance: item.saldo_pendente,
    waitingSupplierItem: item.item_aguardando_fornecedor,
    readyWithoutContactSent: item.pronto_sem_contato_enviado,
    updatedAt: item.updated_at,
    webhookPronto: mapWebhookStateFromApi(item.webhook_pronto),
  })),
});

export const mapSaleFromApi = (sale: ApiSale): Sale => ({
  id: sale.id,
  reference: sale.referencia,
  customerName: sale.cliente_nome,
  paymentMethod: sale.meio_pagamento,
  total: sale.valor_total,
  createdAt: sale.criado_em,
  items: sale.itens.map((item) => ({
    productId: item.produto_id,
    productName: item.produto_nome,
    quantity: item.quantidade,
    unitPrice: item.preco_unitario,
    subtotal: item.subtotal,
  })),
});

export const mapNotificationFromApi = (
  notification: ApiNotification,
): NotificationItem => ({
  id: notification.id,
  type: notification.tipo,
  title: notification.titulo,
  message: notification.mensagem,
  severity: notification.severidade,
  isRead: notification.lida,
  createdAt: notification.created_at,
});

export const mapSupplierFromApi = (supplier: ApiSupplier): Supplier => ({
  id: supplier.id,
  name: supplier.nome,
  phone: supplier.telefone ?? null,
  whatsapp: supplier.whatsapp ?? null,
  email: supplier.email ?? null,
  document: supplier.documento ?? null,
  city: supplier.cidade ?? null,
  notes: supplier.observacoes ?? null,
  isActive: supplier.ativo,
  linkedProductsCount: supplier._count?.produtos_pecas ?? 0,
  linkedFinancialRecordsCount: supplier._count?.contas_financeiras ?? 0,
  createdAt: supplier.created_at,
  updatedAt: supplier.updated_at,
});

export const mapFinancialReportFromApi = (
  report: ApiFinancialReport,
): FinancialReport => ({
  period: {
    days: report.periodo.dias,
    start: report.periodo.inicio,
    origin: report.periodo.origem,
  },
  summary: {
    totalRevenue: report.resumo.faturamento_total,
    totalProfit: report.resumo.lucro_total,
  },
  byOrigin: {
    ordem_servico: {
      revenue: report.porOrigem.ordem_servico.faturamento,
      profit: report.porOrigem.ordem_servico.lucro,
      quantity: report.porOrigem.ordem_servico.quantidade,
    },
    venda: {
      revenue: report.porOrigem.venda.faturamento,
      profit: report.porOrigem.venda.lucro,
      quantity: report.porOrigem.venda.quantidade,
    },
  },
  byPaymentMethod: report.porFormaPagamento as Partial<Record<PaymentMethod, number>>,
  items: report.itens.map((item) => ({
    id: item.id,
    origin: item.origem,
    reference: item.referencia,
    customer: item.cliente,
    description: item.descricao,
    value: item.valor,
    profit: item.lucro,
    date: item.data,
    paymentMethod: item.meio_pagamento ?? null,
  })),
});

export const mapProfessionalOperationFromApi = (
  report: ApiProfessionalOperation,
): ProfessionalOperationPanel => ({
  alerts: {
    stalledOrders: report.alertas.ordens_paradas.map((item) => ({
      id: item.id,
      customer: item.cliente,
      device: item.aparelho,
      status: STATUS_FROM_API[item.status] ?? 'aguardando_orcamento',
      updatedAt: item.updated_at,
    })),
    criticalStock: report.alertas.estoque_critico.map((item) => ({
      id: item.id,
      name: item.nome,
      stock: item.quantidade_estoque,
      minStock: item.estoque_minimo,
      supplierName: item.fornecedor_nome ?? null,
    })),
    pendingPickup: report.alertas.retirada_pendente.map((item) => ({
      id: item.id,
      customer: item.cliente,
      phone: item.telefone,
      pendingBalance: item.saldo_pendente,
      updatedAt: item.updated_at,
    })),
    failingIntegrations: report.alertas.integracoes_falhando.map((item) => ({
      orderId: item.ordem_id,
      customer: item.cliente,
      status: STATUS_FROM_API[item.status] ?? 'aguardando_orcamento',
      webhookStatus: item.webhook_status,
      attemptedAt: item.tentativa_em ?? null,
      response: item.resposta ?? null,
    })),
  },
  indicators: {
    ordersByTechnician: report.indicadores.ordens_por_tecnico.map((item) => ({
      technicianId: item.tecnico_id,
      technicianName: item.tecnico_nome,
      quantity: item.quantidade,
    })),
    overdueOrders: report.indicadores.ordens_atrasadas,
    mostConsumedParts: report.indicadores.pecas_mais_consumidas.map((item) => ({
      productId: item.produto_id,
      name: item.nome,
      supplierName: item.fornecedor_nome ?? null,
      quantity: item.quantidade,
    })),
    bottlenecksByStage: report.indicadores.gargalos_por_etapa.map((item) => ({
      status: STATUS_FROM_API[item.status] ?? 'aguardando_orcamento',
      quantity: item.quantidade,
    })),
  },
  integrations: report.integracoes,
});
