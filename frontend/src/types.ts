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
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  isLowStock: boolean;
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
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
};

export type DashboardLowStockProduct = {
  id: string;
  name: string;
  stock: number;
  minStock: number;
};

export type DashboardSummary = {
  indicators: DashboardIndicators;
  recentOrders: DashboardOrder[];
  lowStockProducts: DashboardLowStockProduct[];
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
  costPrice: string;
  salePrice: string;
  stock: string;
  minStock: string;
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
