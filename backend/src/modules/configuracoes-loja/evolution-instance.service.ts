import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

type EvolutionInstanceSyncResult = {
  instanceName: string;
  qrCode: string | null;
  pairingCode: string | null;
  attempts: number | null;
  created: boolean;
  createdNow: boolean;
  warning: string | null;
};

type EvolutionActionResult = {
  success: boolean;
  message: string;
};

@Injectable()
export class EvolutionInstanceService {
  private readonly logger = new Logger(EvolutionInstanceService.name);

  constructor(
    private readonly configuracoesLojaService: ConfiguracoesLojaService,
    private readonly configService: ConfigService,
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
        instanceName:
          this.extractString(instance, [
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

  async create(): Promise<EvolutionInstanceSyncResult> {
    const config = await this.getValidatedConfig();
    const settings = await this.configuracoesLojaService.getInternal();
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

      try {
        const connection = await this.connect();

        return {
          ...connection,
          created: true,
          createdNow: true,
          warning: null,
        };
      } catch (error) {
        const normalizedError = this.normalizeEvolutionError(
          error,
          'Nao foi possivel gerar o QR Code da instancia.',
        );

        if (
          normalizedError instanceof BadGatewayException &&
          this.isQrNotGeneratedError(normalizedError)
        ) {
          return {
            instanceName: config.instanceName,
            qrCode: null,
            pairingCode: null,
            attempts: 0,
            created: true,
            createdNow: true,
            warning:
              'Instancia criada com sucesso, mas a Evolution API nao gerou QR Code.',
          };
        }

        throw normalizedError;
      }
    } catch (error) {
      if (
        error instanceof BadGatewayException &&
        this.getExceptionMessage(error).toLowerCase().includes('already in use')
      ) {
        try {
          const connection = await this.connect();

          return {
            ...connection,
            created: true,
            createdNow: false,
          };
        } catch (connectError) {
          const normalizedError = this.normalizeEvolutionError(
            connectError,
            'Nao foi possivel gerar o QR Code da instancia.',
          );

          if (
            normalizedError instanceof BadGatewayException &&
            this.isQrNotGeneratedError(normalizedError)
          ) {
            return {
              instanceName: config.instanceName,
              qrCode: null,
              pairingCode: null,
              attempts: 0,
              created: true,
              createdNow: false,
              warning:
                'A instancia ja existia e foi localizada, mas a Evolution API nao gerou QR Code.',
            };
          }

          throw normalizedError;
        }
      }

      throw this.normalizeEvolutionError(
        error,
        'Nao foi possivel criar a instancia na Evolution API.',
      );
    }
  }

  async connect(): Promise<EvolutionInstanceSyncResult> {
    const config = await this.getValidatedConfig();

    try {
      const response = await this.evolutionRequest<EvolutionConnectResponse>(
        `/instance/connect/${encodeURIComponent(config.instanceName)}`,
        {
          method: 'GET',
        },
      );

      const qrCode =
        response.base64?.trim() ||
        this.extractString(response, ['code']) ||
        null;
      const attempts =
        typeof response.count === 'number' ? response.count : null;

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
        created: true,
        createdNow: false,
        warning: null,
      };
    } catch (error) {
      throw this.normalizeEvolutionError(
        error,
        'Nao foi possivel gerar o QR Code da instancia.',
      );
    }
  }

  async restart(): Promise<EvolutionActionResult> {
    const config = await this.getValidatedConfig();

    try {
      await this.evolutionRequest(
        `/instance/restart/${encodeURIComponent(config.instanceName)}`,
        {
          method: 'PUT',
        },
      );

      return {
        success: true,
        message: 'Instancia reiniciada com sucesso na Evolution API.',
      };
    } catch (error) {
      throw this.normalizeEvolutionError(
        error,
        'Nao foi possivel reiniciar a instancia na Evolution API.',
      );
    }
  }

  async logout(): Promise<EvolutionActionResult> {
    const config = await this.getValidatedConfig();

    try {
      await this.evolutionRequest(
        `/instance/logout/${encodeURIComponent(config.instanceName)}`,
        {
          method: 'DELETE',
        },
      );

      return {
        success: true,
        message: 'Sessao da instancia encerrada com sucesso na Evolution API.',
      };
    } catch (error) {
      throw this.normalizeEvolutionError(
        error,
        'Nao foi possivel encerrar a sessao da instancia na Evolution API.',
      );
    }
  }

  async delete(): Promise<EvolutionActionResult> {
    const config = await this.getValidatedConfig();

    try {
      await this.evolutionRequest(
        `/instance/delete/${encodeURIComponent(config.instanceName)}`,
        {
          method: 'DELETE',
        },
      );

      return {
        success: true,
        message: 'Instancia removida com sucesso da Evolution API.',
      };
    } catch (error) {
      throw this.normalizeEvolutionError(
        error,
        'Nao foi possivel remover a instancia na Evolution API.',
      );
    }
  }

  async recreate(): Promise<EvolutionInstanceSyncResult> {
    try {
      await this.delete();
    } catch (error) {
      const normalizedError = this.normalizeEvolutionError(
        error,
        'Nao foi possivel remover a instancia antes de recriar.',
      );

      if (
        normalizedError instanceof BadRequestException &&
        normalizedError.message.includes('ainda nao existe')
      ) {
        return this.create();
      }

      throw normalizedError;
    }

    return this.create();
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
    const settings = await this.configuracoesLojaService.getInternal();
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

  private extractInstances(response: unknown): unknown[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (!response || typeof response !== 'object') {
      return [];
    }

    const candidates = response as {
      value?: unknown;
      instance?: unknown;
      instances?: unknown;
    };

    if (Array.isArray(candidates.value)) {
      return candidates.value;
    }

    if (Array.isArray(candidates.instance)) {
      return candidates.instance;
    }

    if (Array.isArray(candidates.instances)) {
      return candidates.instances;
    }

    return [];
  }

  private async findInstance(config: EvolutionConfig): Promise<object | null> {
    const response = await this.evolutionRequest('/instance/fetchInstances', {
      method: 'GET',
    });

    const instances = this.extractInstances(response);

    const matchedInstance = instances.find((item) => {
      const name = this.extractString(item, [
        'name',
        'instanceName',
        'instance.instanceName',
      ]);

      return name?.toLowerCase() === config.instanceName.toLowerCase();
    });

    return matchedInstance && typeof matchedInstance === 'object'
      ? matchedInstance
      : null;
  }

  private async evolutionRequest<T>(
    path: string,
    input: {
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
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
          const payload = (await response.json().catch(() => null)) as {
            message?: string | string[];
            response?: { message?: string };
          } | null;

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

        this.logger.warn(
          `Falha ao conectar na Evolution API via ${baseUrl}${path}.`,
        );

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
      const message = this.getExceptionMessage(error);

      if (
        message.includes('count') ||
        message.includes('QRCode') ||
        message.includes('QR Code')
      ) {
        return error;
      }

      return new BadGatewayException(message || fallbackMessage);
    }

    return new BadGatewayException(fallbackMessage);
  }

  private buildCandidateBaseUrls(apiBaseUrl: string) {
    const normalized = apiBaseUrl.replace(/\/+$/, '');
    const urls = new Set<string>([normalized]);
    const internalUrl = this.configService
      .get<string>('EVOLUTION_API_INTERNAL_URL')
      ?.trim()
      ?.replace(/\/+$/, '');

    if (internalUrl) {
      urls.add(internalUrl);
    }

    if (normalized.includes('localhost') || normalized.includes('127.0.0.1')) {
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

  private getExceptionMessage(error: BadGatewayException) {
    const response = error.getResponse();

    if (typeof response === 'string' && response.trim()) {
      return response.trim();
    }

    if (response && typeof response === 'object') {
      const message = (response as { message?: string | string[] }).message;

      if (Array.isArray(message)) {
        return message.join(', ');
      }

      if (typeof message === 'string' && message.trim()) {
        return message.trim();
      }
    }

    return error.message;
  }

  private isQrNotGeneratedError(error: BadGatewayException) {
    const message = this.getExceptionMessage(error);

    return (
      message.includes('nao gerou QR Code') || message.includes('sem QR Code')
    );
  }
}
