import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { ConfiguracoesLojaModule } from './modules/configuracoes-loja/configuracoes-loja.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { EstoqueModule } from './modules/estoque/estoque.module';
import { NotificacoesModule } from './modules/notificacoes/notificacoes.module';
import { OrdensServicoModule } from './modules/ordens-servico/ordens-servico.module';
import { VendasModule } from './modules/vendas/vendas.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    PrismaModule,
    AuthModule,
    ClientesModule,
    ConfiguracoesLojaModule,
    EstoqueModule,
    NotificacoesModule,
    OrdensServicoModule,
    DashboardModule,
    VendasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
