import { Controller, Get } from '@nestjs/common';
import { perfil_usuario } from '@prisma/client';
import { DashboardService } from './dashboard.service';
import { Roles } from '../auth/decorators/roles.decorator';

@Roles(
  perfil_usuario.administrador,
  perfil_usuario.atendente,
  perfil_usuario.tecnico,
  perfil_usuario.financeiro,
)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('resumo')
  getResumo() {
    return this.dashboardService.getResumo();
  }
}
