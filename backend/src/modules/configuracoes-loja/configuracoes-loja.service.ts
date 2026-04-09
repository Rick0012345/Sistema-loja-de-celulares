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
      };
    }

    return configuracoes;
  }

  update(dto: UpdateConfiguracoesLojaDto) {
    const telefone_loja = dto.telefone_loja?.trim() || null;

    return this.prisma.configuracoes_loja.upsert({
      where: { id: CONFIGURACOES_LOJA_ID },
      update: {
        telefone_loja,
      },
      create: {
        id: CONFIGURACOES_LOJA_ID,
        telefone_loja,
      },
    });
  }
}
