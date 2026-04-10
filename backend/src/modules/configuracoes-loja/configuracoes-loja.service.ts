import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateConfiguracoesLojaDto } from './configuracoes-loja.dto';

const CONFIGURACOES_LOJA_ID = '00000000-0000-0000-0000-000000000001';

@Injectable()
export class ConfiguracoesLojaService {
  constructor(private readonly prisma: PrismaService) {}

  async get() {
    const configuracoes = await this.prisma.configuracoes_loja.findUnique({
      where: { id: CONFIGURACOES_LOJA_ID },
    });

    if (!configuracoes) {
      return {
        telefone_loja: null,
        evolution_instance_name: null,
        evolution_api_base_url: null,
        evolution_api_key: null,
        ordem_pronta_webhook_url: null,
        ordem_pronta_webhook_token: null,
      };
    }

    return configuracoes;
  }

  update(dto: UpdateConfiguracoesLojaDto) {
    const telefone_loja = dto.telefone_loja?.trim() || null;
    const evolution_instance_name = dto.evolution_instance_name?.trim() || null;
    const evolution_api_base_url = dto.evolution_api_base_url?.trim() || null;
    const evolution_api_key = dto.evolution_api_key?.trim() || null;
    const ordem_pronta_webhook_url =
      dto.ordem_pronta_webhook_url?.trim() || null;
    const ordem_pronta_webhook_token =
      dto.ordem_pronta_webhook_token?.trim() || null;

    return this.prisma.configuracoes_loja.upsert({
      where: { id: CONFIGURACOES_LOJA_ID },
      update: {
        telefone_loja,
        evolution_instance_name,
        evolution_api_base_url,
        evolution_api_key,
        ordem_pronta_webhook_url,
        ordem_pronta_webhook_token,
      },
      create: {
        id: CONFIGURACOES_LOJA_ID,
        telefone_loja,
        evolution_instance_name,
        evolution_api_base_url,
        evolution_api_key,
        ordem_pronta_webhook_url,
        ordem_pronta_webhook_token,
      },
    });
  }
}
