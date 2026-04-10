import { WebhookEventosService } from './webhook-eventos.service';

describe('WebhookEventosService', () => {
  it('tenta URLs alternativas quando localhost falha por erro de rede', async () => {
    const fetchMock = jest
      .fn()
      .mockRejectedValueOnce(new Error('connect ECONNREFUSED 127.0.0.1:5678'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue('ok'),
      });

    const originalFetch = global.fetch;
    global.fetch = fetchMock as typeof fetch;

    const service = new WebhookEventosService(
      {} as never,
      {} as never,
    );

    const result = await (
      service as unknown as {
        sendWebhookRequest: (
          webhookUrl: string,
          webhookToken: string | null,
          payload: Record<string, unknown>,
        ) => Promise<{ ok: boolean; status: number; summary: string }>;
      }
    ).sendWebhookRequest(
      'http://localhost:5678/webhook/ordem-servico-pronta',
      null,
      { ordemId: 'os-1' },
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://localhost:5678/webhook/ordem-servico-pronta',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://n8n:5678/webhook/ordem-servico-pronta',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result.ok).toBe(true);

    global.fetch = originalFetch;
  });
});
