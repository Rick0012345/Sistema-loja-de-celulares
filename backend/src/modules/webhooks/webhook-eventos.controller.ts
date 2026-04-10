import { Controller, Get, Param, Post } from '@nestjs/common';
import { perfil_usuario } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
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
  retry(
    @Param('ordemId') ordemId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.webhookEventosService.retryOrderWebhook(ordemId, currentUser);
  }

  @Get('resumo-operacional')
  getResumoOperacional() {
    return this.webhookEventosService.getOperationalOverview();
  }
}
