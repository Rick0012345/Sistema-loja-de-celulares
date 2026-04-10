import { Controller, Get, Query } from '@nestjs/common';
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

  @Get('fila-operacional')
  getFilaOperacional() {
    return this.dashboardService.getFilaOperacional();
  }

  @Get('relatorios')
  getRelatorios(
    @Query('dias') dias?: string,
    @Query('origem') origem?: 'todas' | 'ordem_servico' | 'venda',
  ) {
    return this.dashboardService.getRelatorios({
      dias: dias ? Number.parseInt(dias, 10) : undefined,
      origem,
    });
  }
}
