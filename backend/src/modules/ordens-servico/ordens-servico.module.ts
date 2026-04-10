import { Module } from '@nestjs/common';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';
import { WebhookEventosModule } from '../webhooks/webhook-eventos.module';
import { OrdensServicoController } from './ordens-servico.controller';
import { OrdensServicoService } from './ordens-servico.service';

@Module({
  imports: [NotificacoesModule, WebhookEventosModule],
  controllers: [OrdensServicoController],
  providers: [OrdensServicoService],
})
export class OrdensServicoModule {}
