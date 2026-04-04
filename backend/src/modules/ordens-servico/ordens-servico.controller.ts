import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { perfil_usuario } from '@prisma/client';
import { OrdensServicoService } from './ordens-servico.service';
import {
  CreateOrdemServicoDto,
  UpdateStatusOrdemServicoDto,
} from './ordens-servico.dto';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@Roles(
  perfil_usuario.administrador,
  perfil_usuario.atendente,
  perfil_usuario.tecnico,
  perfil_usuario.financeiro,
)
@Controller('ordens-servico')
export class OrdensServicoController {
  constructor(private readonly ordensServicoService: OrdensServicoService) {}

  @Get()
  list() {
    return this.ordensServicoService.list();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordensServicoService.findOne(id);
  }

  @Post()
  @Roles(perfil_usuario.administrador, perfil_usuario.atendente)
  create(
    @Body() dto: CreateOrdemServicoDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.ordensServicoService.create(dto, currentUser);
  }

  @Patch(':id/status')
  @Roles(
    perfil_usuario.administrador,
    perfil_usuario.atendente,
    perfil_usuario.tecnico,
  )
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusOrdemServicoDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.ordensServicoService.updateStatus(id, dto, currentUser);
  }
}
