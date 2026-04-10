import {
  mapCustomerFromApi,
  mapDashboardSummaryFromApi,
  mapNotificationFromApi,
  mapProductFromApi,
  mapSaleFromApi,
  mapServiceFromApi,
  serviceStatusToApi,
} from './adapters';
import {
  AuthenticatedUser,
  Customer,
  DashboardSummary,
  EvolutionActionResult,
  EvolutionInstanceConnectResult,
  EvolutionInstanceOverview,
  ManagedUser,
  NotificationItem,
  PaymentMethod,
  Product,
  Sale,
  ServiceOrder,
  ServiceStatus,
  StoreSettings,
} from '../types';

const API_URL =
  import.meta.env.VITE_API_URL?.trim() || 'http://localhost:3001';
const AUTH_TOKEN_STORAGE_KEY = 'consertasmart.auth.token';
const AUTH_USER_STORAGE_KEY = 'consertasmart.auth.user';

export class UnauthorizedError extends Error {}

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

  const authToken = api.getAuthToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...(isJsonBody ? { 'Content-Type': 'application/json' } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
    body: requestBody,
  });

  if (!response.ok) {
    if (response.status === 401) {
      api.clearAuthToken();
      throw new UnauthorizedError('Sua sessao expirou. Entre novamente.');
    }

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
  getAuthToken() {
    return window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  },

  setAuthToken(token: string) {
    window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  },

  getStoredUser(): AuthenticatedUser | null {
    const rawUser = window.sessionStorage.getItem(AUTH_USER_STORAGE_KEY);

    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as AuthenticatedUser;
    } catch {
      window.sessionStorage.removeItem(AUTH_USER_STORAGE_KEY);
      return null;
    }
  },

  setStoredUser(user: AuthenticatedUser) {
    window.sessionStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
  },

  clearAuthToken() {
    window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    window.sessionStorage.removeItem(AUTH_USER_STORAGE_KEY);
  },

  async login(payload: {
    email: string;
    senha: string;
  }): Promise<{ accessToken: string; usuario: AuthenticatedUser }> {
    const response = await request<{ accessToken: string; usuario: AuthenticatedUser }>(
      '/auth/login',
      {
        method: 'POST',
        body: payload,
      },
    );
    api.setAuthToken(response.accessToken);
    api.setStoredUser(response.usuario);
    return response;
  },

  async getCurrentUser(): Promise<AuthenticatedUser> {
    const response = await request<AuthenticatedUser>('/auth/me');
    api.setStoredUser(response);
    return response;
  },

  async listUsers(): Promise<ManagedUser[]> {
    return request<ManagedUser[]>('/auth/users');
  },

  async createUser(payload: {
    nome: string;
    email: string;
    senha: string;
    perfil: AuthenticatedUser['perfil'];
  }): Promise<ManagedUser> {
    return request<ManagedUser>('/auth/users', {
      method: 'POST',
      body: payload,
    });
  },

  async updateUser(
    id: string,
    payload: {
      nome?: string;
      email?: string;
      senha?: string;
      perfil?: AuthenticatedUser['perfil'];
      ativo?: boolean;
    },
  ): Promise<ManagedUser> {
    return request<ManagedUser>(`/auth/users/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },

  async disableUser(id: string): Promise<void> {
    await request(`/auth/users/${id}`, {
      method: 'DELETE',
    });
  },

  async getStoreSettings(): Promise<StoreSettings> {
    const response = await request<{
      telefone_loja?: string | null;
      evolution_instance_name?: string | null;
      evolution_api_base_url?: string | null;
      evolution_api_key_configured?: boolean;
      ordem_pronta_webhook_url?: string | null;
      ordem_pronta_webhook_token_configured?: boolean;
    }>('/configuracoes/loja');
    return {
      storePhone: response.telefone_loja ?? '',
      evolutionInstanceName: response.evolution_instance_name ?? '',
      evolutionApiBaseUrl: response.evolution_api_base_url ?? '',
      evolutionApiKeyConfigured: Boolean(response.evolution_api_key_configured),
      ordemProntaWebhookUrl: response.ordem_pronta_webhook_url ?? '',
      ordemProntaWebhookTokenConfigured: Boolean(
        response.ordem_pronta_webhook_token_configured,
      ),
    };
  },

  async updateStoreSettings(payload: {
    storePhone: string;
    evolutionInstanceName: string;
    evolutionApiBaseUrl: string;
    evolutionApiKey?: string;
    ordemProntaWebhookUrl: string;
    ordemProntaWebhookToken?: string;
  }): Promise<StoreSettings> {
    const response = await request<{
      telefone_loja?: string | null;
      evolution_instance_name?: string | null;
      evolution_api_base_url?: string | null;
      evolution_api_key_configured?: boolean;
      ordem_pronta_webhook_url?: string | null;
      ordem_pronta_webhook_token_configured?: boolean;
    }>('/configuracoes/loja', {
      method: 'PATCH',
      body: {
        telefone_loja: payload.storePhone.trim() || null,
        evolution_instance_name: payload.evolutionInstanceName.trim() || null,
        evolution_api_base_url: payload.evolutionApiBaseUrl.trim() || null,
        ordem_pronta_webhook_url: payload.ordemProntaWebhookUrl.trim() || null,
        ...(payload.evolutionApiKey !== undefined
          ? { evolution_api_key: payload.evolutionApiKey.trim() || null }
          : {}),
        ...(payload.ordemProntaWebhookToken !== undefined
          ? {
              ordem_pronta_webhook_token:
                payload.ordemProntaWebhookToken.trim() || null,
            }
          : {}),
      },
    });

    return {
      storePhone: response.telefone_loja ?? '',
      evolutionInstanceName: response.evolution_instance_name ?? '',
      evolutionApiBaseUrl: response.evolution_api_base_url ?? '',
      evolutionApiKeyConfigured: Boolean(response.evolution_api_key_configured),
      ordemProntaWebhookUrl: response.ordem_pronta_webhook_url ?? '',
      ordemProntaWebhookTokenConfigured: Boolean(
        response.ordem_pronta_webhook_token_configured,
      ),
    };
  },

  async getEvolutionInstanceOverview(): Promise<EvolutionInstanceOverview> {
    const response = await request<{
      configured: boolean;
      exists: boolean;
      instanceName?: string | null;
      connectionStatus?: string | null;
      ownerJid?: string | null;
      profileName?: string | null;
    }>('/configuracoes/loja/evolution/instance');

    return {
      configured: Boolean(response.configured),
      exists: Boolean(response.exists),
      instanceName: response.instanceName ?? '',
      connectionStatus: response.connectionStatus ?? 'unknown',
      ownerJid: response.ownerJid ?? null,
      profileName: response.profileName ?? null,
    };
  },

  async createEvolutionInstance(): Promise<EvolutionInstanceConnectResult> {
    const response = await request<{
      instanceName?: string | null;
      qrCode?: string | null;
      pairingCode?: string | null;
      attempts?: number | null;
      created?: boolean | null;
      createdNow?: boolean | null;
      warning?: string | null;
    }>('/configuracoes/loja/evolution/instance/create', {
      method: 'POST',
    });

    return {
      instanceName: response.instanceName ?? '',
      qrCode: response.qrCode ?? null,
      pairingCode: response.pairingCode ?? null,
      attempts:
        typeof response.attempts === 'number' ? response.attempts : null,
      created: response.created !== false,
      createdNow: Boolean(response.createdNow),
      warning: response.warning ?? null,
    };
  },

  async connectEvolutionInstance(): Promise<EvolutionInstanceConnectResult> {
    const response = await request<{
      instanceName?: string | null;
      qrCode?: string | null;
      pairingCode?: string | null;
      attempts?: number | null;
      created?: boolean | null;
      createdNow?: boolean | null;
      warning?: string | null;
    }>('/configuracoes/loja/evolution/instance/connect', {
      method: 'POST',
    });

    return {
      instanceName: response.instanceName ?? '',
      qrCode: response.qrCode ?? null,
      pairingCode: response.pairingCode ?? null,
      attempts:
        typeof response.attempts === 'number' ? response.attempts : null,
      created: response.created !== false,
      createdNow: Boolean(response.createdNow),
      warning: response.warning ?? null,
    };
  },

  async restartEvolutionInstance(): Promise<EvolutionActionResult> {
    const response = await request<{
      success?: boolean | null;
      message?: string | null;
    }>('/configuracoes/loja/evolution/instance/restart', {
      method: 'POST',
    });

    return {
      success: response.success !== false,
      message: response.message ?? 'Instancia reiniciada com sucesso.',
    };
  },

  async logoutEvolutionInstance(): Promise<EvolutionActionResult> {
    const response = await request<{
      success?: boolean | null;
      message?: string | null;
    }>('/configuracoes/loja/evolution/instance/logout', {
      method: 'POST',
    });

    return {
      success: response.success !== false,
      message: response.message ?? 'Sessao encerrada com sucesso.',
    };
  },

  async recreateEvolutionInstance(): Promise<EvolutionInstanceConnectResult> {
    const response = await request<{
      instanceName?: string | null;
      qrCode?: string | null;
      pairingCode?: string | null;
      attempts?: number | null;
      created?: boolean | null;
      createdNow?: boolean | null;
      warning?: string | null;
    }>('/configuracoes/loja/evolution/instance/recreate', {
      method: 'POST',
    });

    return {
      instanceName: response.instanceName ?? '',
      qrCode: response.qrCode ?? null,
      pairingCode: response.pairingCode ?? null,
      attempts:
        typeof response.attempts === 'number' ? response.attempts : null,
      created: response.created !== false,
      createdNow: Boolean(response.createdNow),
      warning: response.warning ?? null,
    };
  },

  async listProducts(): Promise<Product[]> {
    const response = await request<any[]>('/estoque/produtos');
    return response.map(mapProductFromApi);
  },

  async createProduct(payload: {
    nome: string;
    marca?: string;
    modelo_compatavel?: string;
    sku?: string;
    tipo_estoque: 'manutencao' | 'venda';
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
      tipo_estoque: 'manutencao' | 'venda';
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
    tipo_entrega: 'retirada_loja' | 'entrega';
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

  async updateService(
    id: string,
    payload: {
      cliente_id: string;
      aparelho_marca: string;
      aparelho_modelo: string;
      defeito_relatado: string;
      tipo_entrega: 'retirada_loja' | 'entrega';
      valor_mao_de_obra: number;
      itens?: Array<{
        produto_id: string;
        quantidade: number;
      }>;
    },
  ): Promise<ServiceOrder> {
    const response = await request<any>(`/ordens-servico/${id}`, {
      method: 'PATCH',
      body: payload,
    });
    return mapServiceFromApi(response);
  },

  async updateServiceStatus(
    id: string,
    payload: {
      status: ServiceStatus;
      meio_pagamento?: PaymentMethod;
      observacao?: string;
    },
  ): Promise<ServiceOrder> {
    const response = await request<any>(`/ordens-servico/${id}/status`, {
      method: 'PATCH',
      body: {
        status: serviceStatusToApi(payload.status),
        meio_pagamento: payload.meio_pagamento,
        observacao: payload.observacao,
      },
    });
    return mapServiceFromApi(response);
  },

  async getDashboardSummary(): Promise<DashboardSummary> {
    const response = await request<any>('/dashboard/resumo');
    return mapDashboardSummaryFromApi(response);
  },

  async listSales(): Promise<Sale[]> {
    const response = await request<any[]>('/vendas');
    return response.map(mapSaleFromApi);
  },

  async createSale(payload: {
    cliente_nome?: string;
    cliente_id?: string;
    meio_pagamento: PaymentMethod;
    itens: Array<{ produto_id: string; quantidade: number }>;
  }): Promise<Sale> {
    const response = await request<any>('/vendas', {
      method: 'POST',
      body: payload,
    });
    return mapSaleFromApi(response);
  },

  async listNotifications(limit = 30): Promise<NotificationItem[]> {
    const response = await request<any[]>(`/notificacoes?limit=${limit}`);
    return response.map(mapNotificationFromApi);
  },

  async markNotificationAsRead(id: string): Promise<void> {
    await request(`/notificacoes/${id}/lida`, {
      method: 'PATCH',
    });
  },

  async markAllNotificationsAsRead(): Promise<void> {
    await request('/notificacoes/lidas', {
      method: 'PATCH',
    });
  },
};
