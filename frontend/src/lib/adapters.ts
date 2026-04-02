import {
  Customer,
  DashboardSummary,
  Product,
  ServiceOrder,
  ServiceStatus,
} from '../types';

type ApiProduct = {
  id: string;
  nome: string;
  marca?: string | null;
  modelo_compatavel?: string | null;
  sku?: string | null;
  preco_custo: number;
  preco_venda: number;
  quantidade_estoque: number;
  estoque_minimo: number;
  estoque_baixo?: boolean;
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
  status: string;
  valor_mao_de_obra: number;
  valor_total: number;
  lucro_estimado: number;
  created_at: string;
  updated_at: string;
  itens?: ApiServiceItem[];
  itens_os?: ApiServiceItem[];
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
    created_at: string;
  }>;
  produtosBaixoEstoque: Array<{
    id: string;
    nome: string;
    quantidade_estoque: number;
    estoque_minimo: number;
  }>;
};

const STATUS_FROM_API: Record<string, ServiceStatus> = {
  aguardando_orcamento: 'pending',
  aguardando_aprovacao: 'pending',
  aguardando_peca: 'pending',
  em_conserto: 'in_progress',
  pronto_para_retirada: 'ready',
  entregue: 'delivered',
  cancelada: 'cancelled',
};

const STATUS_TO_API: Record<ServiceStatus, string> = {
  pending: 'aguardando_orcamento',
  in_progress: 'em_conserto',
  ready: 'pronto_para_retirada',
  delivered: 'entregue',
  cancelled: 'cancelada',
};

const STATUS_LABELS: Record<ServiceStatus, string> = {
  pending: 'Pendente',
  in_progress: 'Em Conserto',
  ready: 'Pronto',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

export const serviceStatusToApi = (status: ServiceStatus) => STATUS_TO_API[status];

export const serviceStatusLabel = (status: ServiceStatus) => STATUS_LABELS[status];

export const mapProductFromApi = (product: ApiProduct): Product => ({
  id: product.id,
  name: product.nome,
  brand: product.marca ?? '',
  compatibleModel: product.modelo_compatavel ?? '',
  sku: product.sku ?? '',
  costPrice: product.preco_custo,
  salePrice: product.preco_venda,
  stock: product.quantidade_estoque,
  minStock: product.estoque_minimo,
  isLowStock:
    product.estoque_baixo ?? product.quantidade_estoque <= product.estoque_minimo,
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
  const status = STATUS_FROM_API[service.status] ?? 'pending';

  return {
    id: service.id,
    customerId: service.cliente_id,
    customerName: customer?.nome ?? 'Cliente não informado',
    customerPhone: customer?.telefone ?? '',
    deviceBrand: service.aparelho_marca,
    deviceModel: service.aparelho_modelo,
    issueDescription: service.defeito_relatado,
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
    createdAt: service.created_at,
    updatedAt: service.updated_at,
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
      STATUS_LABELS[STATUS_FROM_API[order.status] ?? 'pending'],
    totalPrice: order.valor_total,
    createdAt: order.created_at,
  })),
  lowStockProducts: summary.produtosBaixoEstoque.map((product) => ({
    id: product.id,
    name: product.nome,
    stock: product.quantidade_estoque,
    minStock: product.estoque_minimo,
  })),
});
