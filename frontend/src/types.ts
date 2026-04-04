export type ThemeMode = 'light' | 'dark';

export type UserProfile = 'administrador' | 'atendente' | 'tecnico' | 'financeiro';

export type AuthenticatedUser = {
  id: string;
  nome: string;
  email: string;
  perfil: UserProfile;
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
  | 'pending'
  | 'in_progress'
  | 'ready'
  | 'delivered'
  | 'cancelled';

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
  status: ServiceStatus;
  partsUsed: ServicePart[];
  laborCost: number;
  totalPrice: number;
  estimatedProfit: number;
  createdAt: string;
  updatedAt: string;
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
  laborCost: string;
  selectedPartId: string;
  partQuantity: string;
};
