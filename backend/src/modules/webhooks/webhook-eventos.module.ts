import { Module } from '@nestjs/common';
import { ConfiguracoesLojaModule } from '../configuracoes-loja/configuracoes-loja.module';
import { WebhookEventosController } from './webhook-eventos.controller';
import { WebhookEventosService } from './webhook-eventos.service';

@Module({
  imports: [ConfiguracoesLojaModule],
  controllers: [WebhookEventosController],
  providers: [WebhookEventosService],
  exports: [WebhookEventosService],
})
export class WebhookEventosModule {}
