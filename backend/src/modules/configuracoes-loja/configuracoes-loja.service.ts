import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  ConfiguracoesLojaInternas,
  ConfiguracoesLojaPublicas,
  UpdateConfiguracoesLojaDto,
} from './configuracoes-loja.dto';

const CONFIGURACOES_LOJA_ID = '00000000-0000-0000-0000-000000000001';

@Injectable()
export class ConfiguracoesLojaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private getEnvFallbacks(): ConfiguracoesLojaInternas {
    return {
      telefone_loja:
        this.configService.get<string>('TELEFONE_LOJA')?.trim() || null,
      evolution_instance_name:
        this.configService.get<string>('EVOLUTION_INSTANCE_NAME')?.trim() ||
        null,
      evolution_api_base_url:
        this.configService.get<string>('EVOLUTION_API_BASE_URL')?.trim() ||
        this.configService.get<string>('EVOLUTION_API_INTERNAL_URL')?.trim() ||
        this.configService.get<string>('EVOLUTION_API_SERVER_URL')?.trim() ||
        null,
      evolution_api_key:
        this.configService.get<string>('EVOLUTION_API_KEY')?.trim() ||
        this.configService
          .get<string>('EVOLUTION_API_AUTHENTICATION_API_KEY')
          ?.trim() ||
        null,
      ordem_pronta_webhook_url:
        this.configService
          .get<string>('ORDEM_SERVICO_PRONTA_WEBHOOK_URL')
          ?.trim() || null,
      ordem_pronta_webhook_token:
        this.configService
          .get<string>('ORDEM_SERVICO_PRONTA_WEBHOOK_TOKEN')
          ?.trim() || null,
    };
  }

  private mergeWithFallbacks(
    configuracoes: Partial<ConfiguracoesLojaInternas> | null,
  ): ConfiguracoesLojaInternas {
    const envFallbacks = this.getEnvFallbacks();

    if (!configuracoes) {
      return envFallbacks;
    }

    return {
      telefone_loja: configuracoes.telefone_loja ?? envFallbacks.telefone_loja,
      evolution_instance_name:
        configuracoes.evolution_instance_name ??
        envFallbacks.evolution_instance_name,
      evolution_api_base_url:
        configuracoes.evolution_api_base_url ??
        envFallbacks.evolution_api_base_url,
      evolution_api_key:
        configuracoes.evolution_api_key ?? envFallbacks.evolution_api_key,
      ordem_pronta_webhook_url:
        configuracoes.ordem_pronta_webhook_url ??
        envFallbacks.ordem_pronta_webhook_url,
      ordem_pronta_webhook_token:
        configuracoes.ordem_pronta_webhook_token ??
        envFallbacks.ordem_pronta_webhook_token,
    };
  }

  private sanitizeForClient(
    configuracoes: ConfiguracoesLojaInternas,
  ): ConfiguracoesLojaPublicas {
    return {
      telefone_loja: configuracoes.telefone_loja,
      evolution_instance_name: configuracoes.evolution_instance_name,
      evolution_api_base_url: configuracoes.evolution_api_base_url,
      evolution_api_key_configured: Boolean(configuracoes.evolution_api_key),
      ordem_pronta_webhook_url: configuracoes.ordem_pronta_webhook_url,
      ordem_pronta_webhook_token_configured: Boolean(
        configuracoes.ordem_pronta_webhook_token,
      ),
    };
  }

  async getInternal(): Promise<ConfiguracoesLojaInternas> {
    const configuracoes = await this.prisma.configuracoes_loja.findUnique({
      where: { id: CONFIGURACOES_LOJA_ID },
    });

    return this.mergeWithFallbacks(configuracoes);
  }

  async getPublic(): Promise<ConfiguracoesLojaPublicas> {
    return this.sanitizeForClient(await this.getInternal());
  }

  async update(
    dto: UpdateConfiguracoesLojaDto,
  ): Promise<ConfiguracoesLojaPublicas> {
    const data = {
      telefone_loja: dto.telefone_loja?.trim() || null,
      evolution_instance_name: dto.evolution_instance_name?.trim() || null,
      evolution_api_base_url: dto.evolution_api_base_url?.trim() || null,
      ordem_pronta_webhook_url: dto.ordem_pronta_webhook_url?.trim() || null,
      ...(dto.evolution_api_key !== undefined
        ? { evolution_api_key: dto.evolution_api_key.trim() || null }
        : {}),
      ...(dto.ordem_pronta_webhook_token !== undefined
        ? {
            ordem_pronta_webhook_token:
              dto.ordem_pronta_webhook_token.trim() || null,
          }
        : {}),
    };

    const configuracoes = await this.prisma.configuracoes_loja.upsert({
      where: { id: CONFIGURACOES_LOJA_ID },
      update: data,
      create: {
        id: CONFIGURACOES_LOJA_ID,
        telefone_loja: data.telefone_loja,
        evolution_instance_name: data.evolution_instance_name,
        evolution_api_base_url: data.evolution_api_base_url,
        evolution_api_key:
          dto.evolution_api_key !== undefined
            ? dto.evolution_api_key.trim() || null
            : null,
        ordem_pronta_webhook_url: data.ordem_pronta_webhook_url,
        ordem_pronta_webhook_token:
          dto.ordem_pronta_webhook_token !== undefined
            ? dto.ordem_pronta_webhook_token.trim() || null
            : null,
      },
    });

    return this.sanitizeForClient(this.mergeWithFallbacks(configuracoes));
  }
}
