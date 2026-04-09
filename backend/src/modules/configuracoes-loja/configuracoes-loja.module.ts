import { Module } from '@nestjs/common';
import { ConfiguracoesLojaController } from './configuracoes-loja.controller';
import { ConfiguracoesLojaService } from './configuracoes-loja.service';

@Module({
  controllers: [ConfiguracoesLojaController],
  providers: [ConfiguracoesLojaService],
})
export class ConfiguracoesLojaModule {}
