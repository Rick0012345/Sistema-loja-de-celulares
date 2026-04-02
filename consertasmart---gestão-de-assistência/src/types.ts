export type Product = {
  id: string;
  name: string;
  category: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
};

export type ServiceStatus = 'pending' | 'in_progress' | 'ready' | 'delivered' | 'cancelled';

export type ServiceOrder = {
  id: string;
  customerName: string;
  customerPhone: string;
  deviceModel: string;
  issueDescription: string;
  status: ServiceStatus;
  partsUsed: { productId: string; quantity: number; costPrice: number }[];
  laborCost: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
};

export type Transaction = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  category: string;
};
