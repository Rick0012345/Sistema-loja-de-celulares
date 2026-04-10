import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfiguracoesLojaService } from './configuracoes-loja.service';

type EvolutionConfig = {
  instanceName: string;
  apiBaseUrl: string;
  apiKey: string;
};

type EvolutionConnectResponse = {
  code?: string;
  base64?: string;
  pairingCode?: string;
  count?: number;
};

@Injectable()
export class EvolutionInstanceService {
  constructor(
    private readonly configuracoesLojaService: ConfiguracoesLojaService,
  ) {}

  async getOverview() {
    const config = await this.getOptionalConfig();

    if (!config) {
      return {
        configured: false,
        exists: false,
        instanceName: '',
        connectionStatus: 'not_configured',
        ownerJid: null,
        profileName: null,
      };
    }

    try {
      const instance = await this.findInstance(config);

      if (!instance) {
        return {
          configured: true,
          exists: false,
          instanceName: config.instanceName,
          connectionStatus: 'not_found',
          ownerJid: null,
          profileName: null,
        };
      }

      const connectionStatus = this.extractConnectionStatus(instance);

      return {
        configured: true,
        exists: true,
        instanceName: this.extractString(instance, [
          'name',
          'instanceName',
          'instance.instanceName',
        ]) ?? config.instanceName,
        connectionStatus,
        ownerJid:
          this.extractString(instance, [
            'ownerJid',
            'instance.ownerJid',
            'instance.owner',
          ]) ?? null,
        profileName:
          this.extractString(instance, [
            'profileName',
            'instance.profileName',
            'instance.profile.name',
          ]) ?? null,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadGatewayException(
        'Nao foi possivel consultar a instancia na Evolution API.',
      );
    }
  }

  async create() {
    const config = await this.getValidatedConfig();
    const settings = await this.configuracoesLojaService.get();
    const storePhoneDigits = (settings.telefone_loja ?? '').replace(/\D/g, '');

    try {
      await this.evolutionRequest('/instance/create', {
        method: 'POST',
        body: {
          instanceName: config.instanceName,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
          number: storePhoneDigits || undefined,
        },
      });

      return this.connect();
    } catch (error) {
      throw this.normalizeEvolutionError(
        error,
        'Nao foi possivel criar a instancia na Evolution API.',
      );
    }
  }

  async connect() {
    const config = await this.getValidatedConfig();

    try {
      const response = await this.evolutionRequest<EvolutionConnectResponse>(
        `/instance/connect/${encodeURIComponent(config.instanceName)}`,
        {
          method: 'GET',
        },
      );

      const qrCode =
        response.base64?.trim() || this.extractString(response, ['code']) || null;
      const attempts = typeof response.count === 'number' ? response.count : null;

      if (!qrCode) {
        throw new BadGatewayException(
          attempts === 0
            ? 'A Evolution API respondeu, mas nao gerou QR Code para essa instancia. Isso indica problema na propria conexao da Evolution com o WhatsApp.'
            : 'A Evolution API respondeu sem QR Code para essa instancia.',
        );
      }

      return {
        instanceName: config.instanceName,
        qrCode,
        pairingCode: response.pairingCode?.trim() || null,
        attempts,
      };
    } catch (error) {
      throw this.normalizeEvolutionError(
        error,
        'Nao foi possivel gerar o QR Code da instancia.',
      );
    }
  }

  private async getValidatedConfig(): Promise<EvolutionConfig> {
    const config = await this.getOptionalConfig();

    if (!config) {
      throw new BadRequestException(
        'Preencha nome da instancia, URL base e API key da Evolution nas configuracoes da loja.',
      );
    }

    return config;
  }

  private async getOptionalConfig(): Promise<EvolutionConfig | null> {
    const settings = await this.configuracoesLojaService.get();
    const instanceName = settings.evolution_instance_name?.trim();
    const apiBaseUrl = settings.evolution_api_base_url?.trim();
    const apiKey = settings.evolution_api_key?.trim();

    if (!instanceName || !apiBaseUrl || !apiKey) {
      return null;
    }

    return {
      instanceName,
      apiBaseUrl: apiBaseUrl.replace(/\/+$/, ''),
      apiKey,
    };
  }

  private async findInstance(config: EvolutionConfig) {
    const response = await this.evolutionRequest<unknown>(
      '/instance/fetchInstances',
      {
        method: 'GET',
      },
    );

    const instances = Array.isArray(response)
      ? response
      : Array.isArray((response as { value?: unknown[] })?.value)
        ? (response as { value: unknown[] }).value
      : Array.isArray((response as { instance?: unknown[] })?.instance)
        ? (response as { instance: unknown[] }).instance
        : Array.isArray((response as { instances?: unknown[] })?.instances)
          ? (response as { instances: unknown[] }).instances
          : [];

    return instances.find((item) => {
      const name = this.extractString(item, [
        'name',
        'instanceName',
        'instance.instanceName',
      ]);

      return name?.toLowerCase() === config.instanceName.toLowerCase();
    });
  }

  private async evolutionRequest<T>(
    path: string,
    input: {
      method: 'GET' | 'POST';
      body?: Record<string, unknown>;
    },
  ): Promise<T> {
    const config = await this.getValidatedConfig();
    const baseUrls = this.buildCandidateBaseUrls(config.apiBaseUrl);
    let lastError: unknown;

    for (const baseUrl of baseUrls) {
      try {
        const response = await fetch(`${baseUrl}${path}`, {
          method: input.method,
          headers: {
            'Content-Type': 'application/json',
            apikey: config.apiKey,
          },
          body: input.body ? JSON.stringify(input.body) : undefined,
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { message?: string | string[]; response?: { message?: string } }
            | null;

          const errorMessage = Array.isArray(payload?.message)
            ? payload?.message.join(', ')
            : payload?.message ||
              payload?.response?.message ||
              `Evolution API respondeu com status ${response.status}.`;

          if (response.status === 404) {
            throw new NotFoundException(errorMessage);
          }

          throw new BadGatewayException(errorMessage);
        }

        return (await response.json().catch(() => ({}))) as T;
      } catch (error) {
        lastError = error;

        if (
          error instanceof NotFoundException ||
          error instanceof BadGatewayException
        ) {
          throw error;
        }
      }
    }

    throw new BadGatewayException(
      `Nao foi possivel conectar na Evolution API usando as URLs: ${baseUrls.join(
        ', ',
      )}.`,
      {
        cause: lastError instanceof Error ? lastError : undefined,
      },
    );
  }

  private normalizeEvolutionError(error: unknown, fallbackMessage: string) {
    if (error instanceof BadRequestException) {
      return error;
    }

    if (error instanceof NotFoundException) {
      return new BadRequestException(
        'A instancia ainda nao existe na Evolution API. Crie a instancia antes de conectar.',
      );
    }

    if (error instanceof BadGatewayException) {
      if (
        error.message.includes('count') ||
        error.message.includes('QRCode') ||
        error.message.includes('QR Code')
      ) {
        return error;
      }

      return new BadGatewayException(error.message || fallbackMessage);
    }

    return new BadGatewayException(fallbackMessage);
  }

  private buildCandidateBaseUrls(apiBaseUrl: string) {
    const normalized = apiBaseUrl.replace(/\/+$/, '');
    const urls = new Set<string>([normalized]);
    const internalUrl = process.env.EVOLUTION_API_INTERNAL_URL?.trim()?.replace(
      /\/+$/,
      '',
    );

    if (internalUrl) {
      urls.add(internalUrl);
    }

    if (
      normalized.includes('localhost') ||
      normalized.includes('127.0.0.1')
    ) {
      urls.add(
        normalized
          .replace('localhost', 'evolution-api')
          .replace('127.0.0.1', 'evolution-api'),
      );
    }

    return [...urls];
  }

  private extractConnectionStatus(value: unknown) {
    return (
      this.extractString(value, [
        'connectionStatus',
        'state',
        'status',
        'instance.status',
        'instance.connectionStatus',
      ]) ?? 'unknown'
    );
  }

  private extractString(value: unknown, paths: string[]) {
    for (const path of paths) {
      const raw = this.getPathValue(value, path);
      if (typeof raw === 'string' && raw.trim().length > 0) {
        return raw.trim();
      }
    }

    return null;
  }

  private getPathValue(value: unknown, path: string) {
    return path.split('.').reduce<unknown>((current, key) => {
      if (current && typeof current === 'object' && key in current) {
        return (current as Record<string, unknown>)[key];
      }

      return undefined;
    }, value);
  }
}
