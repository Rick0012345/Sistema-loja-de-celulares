import { Module } from '@nestjs/common';
import { ConfiguracoesLojaController } from './configuracoes-loja.controller';
import { ConfiguracoesLojaService } from './configuracoes-loja.service';
import { EvolutionInstanceService } from './evolution-instance.service';

@Module({
  controllers: [ConfiguracoesLojaController],
  providers: [ConfiguracoesLojaService, EvolutionInstanceService],
  exports: [ConfiguracoesLojaService],
})
export class ConfiguracoesLojaModule {}
