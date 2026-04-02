import {
  mapCustomerFromApi,
  mapDashboardSummaryFromApi,
  mapProductFromApi,
  mapServiceFromApi,
  serviceStatusToApi,
} from './adapters';
import { Customer, DashboardSummary, Product, ServiceOrder, ServiceStatus } from '../types';

const API_URL = import.meta.env.VITE_API_URL?.trim() || 'http://localhost:3001';

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: BodyInit | Record<string, unknown> | null;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;
  const isJsonBody =
    body !== undefined &&
    body !== null &&
    typeof body === 'object' &&
    !(body instanceof FormData);

  let requestBody: BodyInit | undefined;

  if (isJsonBody) {
    requestBody = JSON.stringify(body);
  } else if (body !== null && body !== undefined) {
    requestBody = body as BodyInit;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...(isJsonBody ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: requestBody,
  });

  if (!response.ok) {
    const payload = await response
      .json()
      .catch(() => ({ message: 'Não foi possível processar a resposta da API.' }));
    const message = Array.isArray(payload.message)
      ? payload.message.join(', ')
      : payload.message || 'Ocorreu um erro ao comunicar com a API.';
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  async listProducts(): Promise<Product[]> {
    const response = await request<any[]>('/estoque/produtos');
    return response.map(mapProductFromApi);
  },

  async createProduct(payload: {
    nome: string;
    marca?: string;
    modelo_compatavel?: string;
    sku?: string;
    estoque_minimo: number;
    preco_custo: number;
    preco_venda: number;
    quantidade_inicial: number;
  }): Promise<Product> {
    const response = await request<any>('/estoque/produtos', {
      method: 'POST',
      body: payload,
    });
    return mapProductFromApi(response);
  },

  async updateProduct(
    id: string,
    payload: {
      nome: string;
      marca?: string;
      modelo_compatavel?: string;
      sku?: string;
      estoque_minimo: number;
      preco_custo: number;
      preco_venda: number;
      quantidade_estoque: number;
    },
  ): Promise<Product> {
    const response = await request<any>(`/estoque/produtos/${id}`, {
      method: 'PATCH',
      body: payload,
    });
    return mapProductFromApi(response);
  },

  async deleteProduct(id: string): Promise<void> {
    await request(`/estoque/produtos/${id}`, {
      method: 'DELETE',
    });
  },

  async listCustomers(): Promise<Customer[]> {
    const response = await request<any[]>('/clientes');
    return response.map(mapCustomerFromApi);
  },

  async createCustomer(payload: {
    nome: string;
    telefone: string;
  }): Promise<Customer> {
    const response = await request<any>('/clientes', {
      method: 'POST',
      body: payload,
    });
    return mapCustomerFromApi(response);
  },

  async listServices(): Promise<ServiceOrder[]> {
    const response = await request<any[]>('/ordens-servico');
    return response.map(mapServiceFromApi);
  },

  async createService(payload: {
    cliente_id: string;
    aparelho_marca: string;
    aparelho_modelo: string;
    defeito_relatado: string;
    termo_responsabilidade_aceito: boolean;
    valor_mao_de_obra: number;
    itens?: Array<{
      produto_id: string;
      quantidade: number;
    }>;
  }): Promise<ServiceOrder> {
    const response = await request<any>('/ordens-servico', {
      method: 'POST',
      body: payload,
    });
    return mapServiceFromApi(response);
  },

  async updateServiceStatus(
    id: string,
    status: ServiceStatus,
  ): Promise<ServiceOrder> {
    const response = await request<any>(`/ordens-servico/${id}/status`, {
      method: 'PATCH',
      body: {
        status: serviceStatusToApi(status),
      },
    });
    return mapServiceFromApi(response);
  },

  async getDashboardSummary(): Promise<DashboardSummary> {
    const response = await request<any>('/dashboard/resumo');
    return mapDashboardSummaryFromApi(response);
  },
};
