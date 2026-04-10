import { Module } from '@nestjs/common';
import { WebhookEventosService } from './webhook-eventos.service';

@Module({
  providers: [WebhookEventosService],
  exports: [WebhookEventosService],
})
export class WebhookEventosModule {}
