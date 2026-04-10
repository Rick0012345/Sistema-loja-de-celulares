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
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateFornecedorDto, UpdateFornecedorDto } from './fornecedores.dto';
import { FornecedoresService } from './fornecedores.service';

@Roles(
  perfil_usuario.administrador,
  perfil_usuario.atendente,
  perfil_usuario.financeiro,
)
@Controller('fornecedores')
export class FornecedoresController {
  constructor(private readonly fornecedoresService: FornecedoresService) {}

  @Get()
  list() {
    return this.fornecedoresService.list();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fornecedoresService.findOne(id);
  }

  @Post()
  @Roles(perfil_usuario.administrador, perfil_usuario.atendente)
  create(@Body() dto: CreateFornecedorDto) {
    return this.fornecedoresService.create(dto);
  }

  @Patch(':id')
  @Roles(perfil_usuario.administrador, perfil_usuario.atendente)
  update(@Param('id') id: string, @Body() dto: UpdateFornecedorDto) {
    return this.fornecedoresService.update(id, dto);
  }

  @Delete(':id')
  @Roles(perfil_usuario.administrador)
  remove(@Param('id') id: string) {
    return this.fornecedoresService.remove(id);
  }
}
