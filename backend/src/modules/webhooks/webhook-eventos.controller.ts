import { Controller, Get, Param, Post } from '@nestjs/common';
import { perfil_usuario } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { WebhookEventosService } from './webhook-eventos.service';

@Roles(
  perfil_usuario.administrador,
  perfil_usuario.atendente,
  perfil_usuario.financeiro,
)
@Controller('webhooks')
export class WebhookEventosController {
  constructor(private readonly webhookEventosService: WebhookEventosService) {}

  @Get('ordens-servico/:ordemId')
  listByOrder(@Param('ordemId') ordemId: string) {
    return this.webhookEventosService.getOrderWebhookState(ordemId);
  }

  @Post('ordens-servico/:ordemId/reenviar')
  retry(@Param('ordemId') ordemId: string) {
    return this.webhookEventosService.retryOrderWebhook(ordemId);
  }

  @Get('resumo-operacional')
  getResumoOperacional() {
    return this.webhookEventosService.getOperationalOverview();
  }
}
