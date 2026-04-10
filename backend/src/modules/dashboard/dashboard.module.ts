import { Module } from '@nestjs/common';
import { WebhookEventosModule } from '../webhooks/webhook-eventos.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [WebhookEventosModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
