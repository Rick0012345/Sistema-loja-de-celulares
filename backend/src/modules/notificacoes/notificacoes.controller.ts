import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { perfil_usuario } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { NotificacoesService } from './notificacoes.service';

@Roles(
  perfil_usuario.administrador,
  perfil_usuario.atendente,
  perfil_usuario.tecnico,
  perfil_usuario.financeiro,
)
@Controller('notificacoes')
export class NotificacoesController {
  constructor(private readonly notificacoesService: NotificacoesService) {}

  @Get()
  list(@Query('limit') limit?: string) {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : undefined;
    return this.notificacoesService.list(parsedLimit);
  }

  @Patch(':id/lida')
  markAsRead(@Param('id') id: string) {
    return this.notificacoesService.markAsRead(id);
  }

  @Patch('lidas')
  markAllAsRead() {
    return this.notificacoesService.markAllAsRead();
  }
}
