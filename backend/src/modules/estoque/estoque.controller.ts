import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { perfil_usuario } from '@prisma/client';
import { EstoqueService } from './estoque.service';
import {
  CreateProdutoDto,
  RegistrarMovimentacaoDto,
  UpdateProdutoDto,
} from './estoque.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Roles(
  perfil_usuario.administrador,
  perfil_usuario.atendente,
  perfil_usuario.tecnico,
  perfil_usuario.financeiro,
)
@Controller('estoque')
export class EstoqueController {
  constructor(private readonly estoqueService: EstoqueService) {}

  @Get('produtos')
  list() {
    return this.estoqueService.list();
  }

  @Get('produtos/:id')
  findOne(@Param('id') id: string) {
    return this.estoqueService.findOne(id);
  }

  @Post('produtos')
  @Roles(perfil_usuario.administrador, perfil_usuario.atendente)
  create(@Body() dto: CreateProdutoDto) {
    return this.estoqueService.create(dto);
  }

  @Patch('produtos/:id')
  @Roles(perfil_usuario.administrador, perfil_usuario.atendente)
  update(@Param('id') id: string, @Body() dto: UpdateProdutoDto) {
    return this.estoqueService.update(id, dto);
  }

  @Delete('produtos/:id')
  @Roles(perfil_usuario.administrador)
  remove(@Param('id') id: string) {
    return this.estoqueService.remove(id);
  }

  @Post('produtos/:id/movimentacoes')
  @Roles(perfil_usuario.administrador, perfil_usuario.atendente)
  registrarMovimentacao(
    @Param('id') id: string,
    @Body() dto: RegistrarMovimentacaoDto,
  ) {
    return this.estoqueService.registrarMovimentacao(id, dto);
  }
}
