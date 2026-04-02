import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus() {
    return {
      nome: 'Sistema de Gestão para Loja de Celulares',
      status: 'online',
      versao: '0.1.0',
      timestamp: new Date().toISOString(),
    };
  }
}
