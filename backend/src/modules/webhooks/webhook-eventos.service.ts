import { Injectable, Logger } from '@nestjs/common';
import { Prisma, tipo_entrega_os } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConfiguracoesLojaService } from '../configuracoes-loja/configuracoes-loja.service';

type OrdemServicoProntaInput = {
  ordemId: string;
  clienteNome: string;
  clienteTelefone: string;
  tipoEntrega: tipo_entrega_os;
  aparelhoMarca: string;
  aparelhoModelo: string;
};

@Injectable()
export class WebhookEventosService {
  private readonly logger = new Logger(WebhookEventosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configuracoesLojaService: ConfiguracoesLojaService,
  ) {}

  async dispatchOrdemServicoPronta(input: OrdemServicoProntaInput) {
    const configuracoesLoja = await this.configuracoesLojaService.getInternal();
    const webhookUrl =
      configuracoesLoja.ordem_pronta_webhook_url?.trim() || null;
    const webhookToken =
      configuracoesLoja.ordem_pronta_webhook_token?.trim() || null;

    const payload = {
      ordemId: input.ordemId,
      clienteNome: input.clienteNome,
      clienteTelefone: input.clienteTelefone,
      clienteTelefoneNumerico: this.normalizePhone(input.clienteTelefone),
      tipoEntrega: input.tipoEntrega,
      aparelhoMarca: input.aparelhoMarca,
      aparelhoModelo: input.aparelhoModelo,
      mensagem: this.buildMensagemCliente(input.tipoEntrega),
      status: 'pronto_para_retirada',
      enviadoEm: new Date().toISOString(),
    };

    if (!webhookUrl) {
      await this.saveWebhookEvent({
        evento: 'ordem_servico_pronta',
        referenciaId: input.ordemId,
        payload,
        sucesso: false,
        resposta:
          'Webhook de OS pronta nao configurado nas configuracoes da loja. Evento nao enviado.',
      });
      return;
    }

    try {
      const response = await this.sendWebhookRequest(
        webhookUrl,
        webhookToken,
        payload,
      );

      await this.saveWebhookEvent({
        evento: 'ordem_servico_pronta',
        referenciaId: input.ordemId,
        payload,
        sucesso: response.ok,
        resposta: response.summary,
      });

      if (!response.ok) {
        this.logger.warn(
          `Falha ao enviar webhook da OS ${input.ordemId}: ${response.summary}.`,
        );
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Erro desconhecido ao enviar webhook.';

      await this.saveWebhookEvent({
        evento: 'ordem_servico_pronta',
        referenciaId: input.ordemId,
        payload,
        sucesso: false,
        resposta: message,
      });

      this.logger.warn(
        `Falha ao enviar webhook da OS ${input.ordemId}: ${message}`,
      );
    }
  }

  buildMensagemCliente(tipoEntrega: tipo_entrega_os) {
    if (tipoEntrega === tipo_entrega_os.entrega) {
      return 'seu conserto esta finalizado, nosso entregador ira realizar a entrega nas proximas horas';
    }

    return 'vc ja pode retirar na loja';
  }

  private normalizePhone(phone: string) {
    return phone.replace(/\D/g, '');
  }

  private async sendWebhookRequest(
    webhookUrl: string,
    webhookToken: string | null,
    payload: Record<string, unknown>,
  ) {
    const urls = this.buildWebhookCandidateUrls(webhookUrl);
    let lastResponse: {
      ok: boolean;
      status: number;
      summary: string;
    } | null = null;

    for (const url of urls) {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(webhookToken ? { 'x-webhook-token': webhookToken } : {}),
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });

      const responseBody = await response.text();
      const summary = `HTTP ${response.status} [${url}]${
        responseBody ? ` - ${responseBody}` : ''
      }`;

      lastResponse = {
        ok: response.ok,
        status: response.status,
        summary,
      };

      if (response.ok) {
        return lastResponse;
      }
    }

    return (
      lastResponse ?? {
        ok: false,
        status: 0,
        summary: 'Nenhuma tentativa de envio do webhook foi executada.',
      }
    );
  }

  private buildWebhookCandidateUrls(webhookUrl: string) {
    const candidates = [webhookUrl];

    try {
      const parsedUrl = new URL(webhookUrl);
      const isLocalHost =
        parsedUrl.hostname === 'localhost' ||
        parsedUrl.hostname === '127.0.0.1';

      if (isLocalHost) {
        const n8nUrl = new URL(webhookUrl);
        n8nUrl.hostname = 'n8n';
        candidates.push(n8nUrl.toString());

        const dockerHostUrl = new URL(webhookUrl);
        dockerHostUrl.hostname = 'host.docker.internal';
        candidates.push(dockerHostUrl.toString());
      }
    } catch {
      return candidates;
    }

    return [...new Set(candidates)];
  }

  private async saveWebhookEvent(input: {
    evento: string;
    referenciaId: string;
    payload: Prisma.InputJsonValue;
    sucesso: boolean;
    resposta: string;
  }) {
    await this.prisma.webhook_eventos.create({
      data: {
        evento: input.evento,
        referencia_id: input.referenciaId,
        payload: input.payload,
        sucesso: input.sucesso,
        resposta: input.resposta,
      },
    });
  }
}
