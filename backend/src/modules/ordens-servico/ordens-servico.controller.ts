import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { OrdensServicoService } from './ordens-servico.service';
import {
  CreateOrdemServicoDto,
  UpdateStatusOrdemServicoDto,
} from './ordens-servico.dto';

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
  create(@Body() dto: CreateOrdemServicoDto) {
    return this.ordensServicoService.create(dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusOrdemServicoDto) {
    return this.ordensServicoService.updateStatus(id, dto);
  }
}
