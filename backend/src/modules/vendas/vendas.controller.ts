import { Body, Controller, Get, Post } from '@nestjs/common';
import { perfil_usuario } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateVendaDto } from './vendas.dto';
import { VendasService } from './vendas.service';

@Roles(
  perfil_usuario.administrador,
  perfil_usuario.atendente,
  perfil_usuario.financeiro,
)
@Controller('vendas')
export class VendasController {
  constructor(private readonly vendasService: VendasService) {}

  @Get()
  list() {
    return this.vendasService.list();
  }

  @Post()
  create(@Body() dto: CreateVendaDto) {
    return this.vendasService.create(dto);
  }
}
