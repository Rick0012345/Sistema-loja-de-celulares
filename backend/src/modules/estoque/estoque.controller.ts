import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { EstoqueService } from './estoque.service';
import {
  CreateProdutoDto,
  RegistrarMovimentacaoDto,
  UpdateProdutoDto,
} from './estoque.dto';

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
  create(@Body() dto: CreateProdutoDto) {
    return this.estoqueService.create(dto);
  }

  @Patch('produtos/:id')
  update(@Param('id') id: string, @Body() dto: UpdateProdutoDto) {
    return this.estoqueService.update(id, dto);
  }

  @Delete('produtos/:id')
  remove(@Param('id') id: string) {
    return this.estoqueService.remove(id);
  }

  @Post('produtos/:id/movimentacoes')
  registrarMovimentacao(
    @Param('id') id: string,
    @Body() dto: RegistrarMovimentacaoDto,
  ) {
    return this.estoqueService.registrarMovimentacao(id, dto);
  }
}
