import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

type HealthcheckResponse = {
  nome: string;
  status: string;
  versao: string;
  timestamp: string;
};

const isHealthcheckResponse = (
  value: unknown,
): value is HealthcheckResponse => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.nome === 'string' &&
    typeof candidate.status === 'string' &&
    typeof candidate.versao === 'string' &&
    typeof candidate.timestamp === 'string'
  );
};

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((response: { body: unknown }) => {
        expect(isHealthcheckResponse(response.body)).toBe(true);

        if (!isHealthcheckResponse(response.body)) {
          throw new Error('Resposta do healthcheck em formato invalido.');
        }

        expect(response.body.nome).toBe(
          'Sistema de Gestao para Loja de Celulares',
        );
        expect(response.body.status).toBe('online');
        expect(response.body.versao).toBe('0.1.0');
        expect(response.body.timestamp).toEqual(expect.any(String));
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
