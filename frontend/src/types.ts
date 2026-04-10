export type ThemeMode = 'light' | 'dark';

export type UserProfile = 'administrador' | 'atendente' | 'tecnico' | 'financeiro';

export type AuthenticatedUser = {
  id: string;
  nome: string;
  email: string;
  perfil: UserProfile;
};

export type ManagedUser = {
  id: string;
  nome: string;
  email: string;
  perfil: UserProfile;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

export type StoreSettings = {
  storePhone: string;
  evolutionInstanceName: string;
  evolutionApiBaseUrl: string;
  evolutionApiKeyConfigured: boolean;
  ordemProntaWebhookUrl: string;
  ordemProntaWebhookTokenConfigured: boolean;
};

export type EvolutionInstanceOverview = {
  configured: boolean;
  exists: boolean;
  instanceName: string;
  connectionStatus: string;
  ownerJid: string | null;
  profileName: string | null;
};

export type EvolutionInstanceConnectResult = {
  instanceName: string;
  qrCode: string | null;
  pairingCode: string | null;
  attempts: number | null;
  created: boolean;
  createdNow: boolean;
  warning: string | null;
};

export type EvolutionActionResult = {
  success: boolean;
  message: string;
};

export type AuthStatus = {
  possuiUsuarios: boolean;
  totalUsuarios: number;
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  compatibleModel: string;
  sku: string;
  categoryId: string | null;
  categoryName: string;
  inventoryType: 'repair' | 'sales' | 'uncategorized';
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  isLowStock: boolean;
  preferredSupplier: SupplierSummary | null;
};

export type Supplier = {
  id: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  document: string | null;
  city: string | null;
  notes: string | null;
  isActive: boolean;
  linkedProductsCount: number;
  linkedFinancialRecordsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type SupplierSummary = {
  id: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  city: string | null;
  isActive: boolean;
};

export type ServiceOrderActor = {
  id: string;
  nome: string;
  email: string;
  perfil: UserProfile;
};

export type ServiceOrderTimelineItem = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  createdAt: string;
  actor: ServiceOrderActor | null;
  metadata?: Record<string, unknown> | null;
};

export type ServiceStatus =
  | 'aguardando_orcamento'
  | 'aguardando_aprovacao'
  | 'aguardando_peca'
  | 'em_conserto'
  | 'pronto_para_retirada'
  | 'entregue'
  | 'cancelada';

export type ServiceDeliveryType = 'store_pickup' | 'delivery';

export type ServicePart = {
  id: string;
  productId: string | null;
  description: string;
  quantity: number;
  costPrice: number;
  salePrice: number;
  subtotal: number;
};

export type ServiceOrder = {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  deviceBrand: string;
  deviceModel: string;
  issueDescription: string;
  deliveryType: ServiceDeliveryType;
  status: ServiceStatus;
  partsUsed: ServicePart[];
  laborCost: number;
  totalPrice: number;
  estimatedProfit: number;
  pendingBalance: number;
  readyWithoutContactSent: boolean;
  webhookPronto: ServiceOrderWebhook | null;
  audit?: {
    createdBy: ServiceOrderActor | null;
    attendant: ServiceOrderActor | null;
    technician: ServiceOrderActor | null;
    deliveredBy: ServiceOrderActor | null;
  };
  timeline?: ServiceOrderTimelineItem[];
  createdAt: string;
  updatedAt: string;
};

export type ServiceOrderWebhookStatus =
  | 'nunca_configurado'
  | 'nao_enviado'
  | 'enviado'
  | 'pendente_reenvio';

export type ServiceOrderWebhookHistoryItem = {
  id: string;
  event: string;
  referenceId: string;
  success: boolean;
  response: string | null;
  createdAt: string;
};

export type ServiceOrderWebhook = {
  configured: boolean;
  status: ServiceOrderWebhookStatus;
  attempts: number;
  latestAttemptAt: string | null;
  latestResponse: string | null;
  sentSuccessfully: boolean;
  history?: ServiceOrderWebhookHistoryItem[];
};

export type PaymentMethod =
  | 'dinheiro'
  | 'pix'
  | 'cartao_credito'
  | 'cartao_debito'
  | 'transferencia';

export type SaleItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type Sale = {
  id: string;
  reference: string;
  customerName: string;
  paymentMethod: PaymentMethod;
  total: number;
  createdAt: string;
  items: SaleItem[];
};

export type NotificationSeverity = 'info' | 'warning' | 'critical' | 'success';

export type NotificationType =
  | 'estoque_baixo'
  | 'estoque_critico'
  | 'venda_registrada'
  | 'ordem_status_atualizado'
  | 'produto_cadastrado';

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  isRead: boolean;
  createdAt: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  cpf: string | null;
};

export type DashboardIndicators = {
  totalClientes: number;
  totalProdutos: number;
  totalOrdensAbertas: number;
  totalProdutosBaixoEstoque: number;
  faturamentoMes: number;
  lucroMes: number;
};

export type DashboardOrder = {
  id: string;
  customerName: string;
  deviceLabel: string;
  statusLabel: string;
  totalPrice: number;
  pendingBalance: number;
  createdAt: string;
};

export type DashboardLowStockProduct = {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  supplierName: string | null;
};

export type OperationalQueueItem = {
  id: string;
  customerName: string;
  customerPhone: string;
  deviceLabel: string;
  status: ServiceStatus;
  totalPrice: number;
  pendingBalance: number;
  waitingSupplierItem: boolean;
  readyWithoutContactSent: boolean;
  updatedAt: string;
  webhookPronto: ServiceOrderWebhook | null;
};

export type FinancialReportOrigin = 'todas' | 'ordem_servico' | 'venda';

export type FinancialReportItem = {
  id: string;
  origin: Exclude<FinancialReportOrigin, 'todas'>;
  reference: string;
  customer: string;
  description: string;
  value: number;
  profit: number;
  date: string;
  paymentMethod: PaymentMethod | null;
};

export type FinancialReport = {
  period: {
    days: number;
    start: string;
    origin: FinancialReportOrigin;
  };
  summary: {
    totalRevenue: number;
    totalProfit: number;
  };
  byOrigin: Record<
    Exclude<FinancialReportOrigin, 'todas'>,
    {
      revenue: number;
      profit: number;
      quantity: number;
    }
  >;
  byPaymentMethod: Partial<Record<PaymentMethod, number>>;
  items: FinancialReportItem[];
};

export type DashboardSummary = {
  indicators: DashboardIndicators;
  recentOrders: DashboardOrder[];
  lowStockProducts: DashboardLowStockProduct[];
  operationalQueue: OperationalQueueItem[];
};

export type ProfessionalOperationPanel = {
  alerts: {
    stalledOrders: Array<{
      id: string;
      customer: string;
      device: string;
      status: ServiceStatus;
      updatedAt: string;
    }>;
    criticalStock: Array<{
      id: string;
      name: string;
      stock: number;
      minStock: number;
      supplierName: string | null;
    }>;
    pendingPickup: Array<{
      id: string;
      customer: string;
      phone: string;
      pendingBalance: number;
      updatedAt: string;
    }>;
    failingIntegrations: Array<{
      orderId: string;
      customer: string;
      status: ServiceStatus;
      webhookStatus: string;
      attemptedAt: string | null;
      response: string | null;
    }>;
  };
  indicators: {
    ordersByTechnician: Array<{
      technicianId: string;
      technicianName: string;
      quantity: number;
    }>;
    overdueOrders: number;
    mostConsumedParts: Array<{
      productId: string;
      name: string;
      supplierName: string | null;
      quantity: number;
    }>;
    bottlenecksByStage: Array<{
      status: ServiceStatus;
      quantity: number;
    }>;
  };
  integrations: {
    enviadas: number;
    pendentesReenvio: number;
    naoEnviadas: number;
    nuncaConfigurado: number;
  };
};

export type ServicePartFormValue = {
  id?: string;
  productId: string;
  description: string;
  quantity: string;
  costPrice: string;
  salePrice: string;
};

export type ProductFormValues = {
  name: string;
  brand: string;
  compatibleModel: string;
  sku: string;
  inventoryType: 'repair' | 'sales';
  supplierId: string;
  costPrice: string;
  salePrice: string;
  stock: string;
  minStock: string;
};

export type SupplierFormValues = {
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  document: string;
  city: string;
  notes: string;
  isActive: boolean;
};

export type ServiceFormValues = {
  customerName: string;
  customerPhone: string;
  deviceBrand: string;
  deviceModel: string;
  issueDescription: string;
  deliveryType: ServiceDeliveryType;
  laborCost: string;
  parts: ServicePartFormValue[];
};

export type SaleFormValues = {
  customerName: string;
  paymentMethod: PaymentMethod;
  items: Array<{
    productId: string;
    quantity: string;
  }>;
};
