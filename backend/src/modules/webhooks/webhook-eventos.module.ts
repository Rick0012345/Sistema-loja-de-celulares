import { Module } from '@nestjs/common';
import { ConfiguracoesLojaModule } from '../configuracoes-loja/configuracoes-loja.module';
import { WebhookEventosService } from './webhook-eventos.service';

@Module({
  imports: [ConfiguracoesLojaModule],
  providers: [WebhookEventosService],
  exports: [WebhookEventosService],
})
export class WebhookEventosModule {}
