import { Injectable, Logger } from '@nestjs/common';
import { Prisma, tipo_entrega_os } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

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

  constructor(private readonly prisma: PrismaService) {}

  async dispatchOrdemServicoPronta(input: OrdemServicoProntaInput) {
    const configuracoesLoja = await this.prisma.configuracoes_loja.findUnique({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      select: {
        evolution_instance_name: true,
        ordem_pronta_webhook_url: true,
        ordem_pronta_webhook_token: true,
      },
    });
    const webhookUrl = configuracoesLoja?.ordem_pronta_webhook_url?.trim() || null;
    const webhookToken =
      configuracoesLoja?.ordem_pronta_webhook_token?.trim() || null;

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

    if (!configuracoesLoja?.evolution_instance_name?.trim()) {
      await this.saveWebhookEvent({
        evento: 'ordem_servico_pronta',
        referenciaId: input.ordemId,
        payload,
        sucesso: false,
        resposta:
          'Nome da instancia Evolution nao configurado em configuracoes da loja.',
      });
      return;
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(webhookToken ? { 'x-webhook-token': webhookToken } : {}),
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });

      const responseBody = await response.text();

      await this.saveWebhookEvent({
        evento: 'ordem_servico_pronta',
        referenciaId: input.ordemId,
        payload,
        sucesso: response.ok,
        resposta: `HTTP ${response.status}${responseBody ? ` - ${responseBody}` : ''}`,
      });

      if (!response.ok) {
        this.logger.warn(
          `Falha ao enviar webhook da OS ${input.ordemId}: HTTP ${response.status}.`,
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
