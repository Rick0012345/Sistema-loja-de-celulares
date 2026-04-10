import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { perfil_usuario } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateConfiguracoesLojaDto } from './configuracoes-loja.dto';
import { ConfiguracoesLojaService } from './configuracoes-loja.service';
import { EvolutionInstanceService } from './evolution-instance.service';

@Controller('configuracoes/loja')
@Roles(perfil_usuario.administrador)
export class ConfiguracoesLojaController {
  constructor(
    private readonly configuracoesLojaService: ConfiguracoesLojaService,
    private readonly evolutionInstanceService: EvolutionInstanceService,
  ) {}

  @Get()
  get() {
    return this.configuracoesLojaService.getPublic();
  }

  @Patch()
  update(@Body() dto: UpdateConfiguracoesLojaDto) {
    return this.configuracoesLojaService.update(dto);
  }

  @Get('evolution/instance')
  getEvolutionInstanceOverview() {
    return this.evolutionInstanceService.getOverview();
  }

  @Post('evolution/instance/create')
  createEvolutionInstance() {
    return this.evolutionInstanceService.create();
  }

  @Post('evolution/instance/connect')
  connectEvolutionInstance() {
    return this.evolutionInstanceService.connect();
  }

  @Post('evolution/instance/restart')
  restartEvolutionInstance() {
    return this.evolutionInstanceService.restart();
  }

  @Post('evolution/instance/logout')
  logoutEvolutionInstance() {
    return this.evolutionInstanceService.logout();
  }

  @Post('evolution/instance/recreate')
  recreateEvolutionInstance() {
    return this.evolutionInstanceService.recreate();
  }
}
