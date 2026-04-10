import { Body, Controller, Get, Patch } from '@nestjs/common';
import { perfil_usuario } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateConfiguracoesLojaDto } from './configuracoes-loja.dto';
import { ConfiguracoesLojaService } from './configuracoes-loja.service';

@Controller('configuracoes/loja')
@Roles(perfil_usuario.administrador)
export class ConfiguracoesLojaController {
  constructor(
    private readonly configuracoesLojaService: ConfiguracoesLojaService,
  ) {}

  @Get()
  get() {
    return this.configuracoesLojaService.get();
  }

  @Patch()
  update(@Body() dto: UpdateConfiguracoesLojaDto) {
    return this.configuracoesLojaService.update(dto);
  }
}
