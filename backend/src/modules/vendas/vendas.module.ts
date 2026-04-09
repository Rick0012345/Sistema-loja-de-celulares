import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';
import { VendasController } from './vendas.controller';
import { VendasService } from './vendas.service';

@Module({
  imports: [PrismaModule, NotificacoesModule],
  controllers: [VendasController],
  providers: [VendasService],
  exports: [VendasService],
})
export class VendasModule {}
