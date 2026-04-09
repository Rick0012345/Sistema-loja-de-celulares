import { Module } from '@nestjs/common';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';
import { OrdensServicoController } from './ordens-servico.controller';
import { OrdensServicoService } from './ordens-servico.service';

@Module({
  imports: [NotificacoesModule],
  controllers: [OrdensServicoController],
  providers: [OrdensServicoService],
})
export class OrdensServicoModule {}
