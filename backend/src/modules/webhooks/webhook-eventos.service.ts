import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, status_ordem_servico, tipo_entrega_os } from '@prisma/client';
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

type WebhookOrderStateStatus =
  | 'nunca_configurado'
  | 'nao_enviado'
  | 'enviado'
  | 'pendente_reenvio';

type WebhookOrderState = {
  configured: boolean;
  status: WebhookOrderStateStatus;
  attempts: number;
  latestAttemptAt: Date | null;
  latestResponse: string | null;
  sentSuccessfully: boolean;
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
      return this.getOrderWebhookState(input.ordemId);
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

    return this.getOrderWebhookState(input.ordemId);
  }

  async listByOrder(ordemId: string) {
    const eventos = await this.prisma.webhook_eventos.findMany({
      where: {
        evento: 'ordem_servico_pronta',
        referencia_id: ordemId,
      },
      orderBy: { created_at: 'desc' },
    });

    return eventos.map((evento) => ({
      id: evento.id,
      evento: evento.evento,
      referencia_id: evento.referencia_id,
      sucesso: evento.sucesso,
      resposta: evento.resposta,
      created_at: evento.created_at,
    }));
  }

  async getOrderWebhookState(ordemId: string) {
    const configuracoesLoja = await this.configuracoesLojaService.getInternal();
    const isConfigured = Boolean(
      configuracoesLoja.ordem_pronta_webhook_url?.trim(),
    );
    const historico = await this.listByOrder(ordemId);
    const latest = historico[0] ?? null;

    let status: WebhookOrderStateStatus = 'nao_enviado';

    if (!isConfigured) {
      status = 'nunca_configurado';
    } else if (!latest) {
      status = 'nao_enviado';
    } else if (latest.sucesso) {
      status = 'enviado';
    } else {
      status = 'pendente_reenvio';
    }

    return {
      configured: isConfigured,
      status,
      attempts: historico.length,
      latestAttemptAt: latest?.created_at ?? null,
      latestResponse: latest?.resposta ?? null,
      sentSuccessfully: latest?.sucesso ?? false,
      history: historico,
    };
  }

  async getOperationalOverview() {
    const ordensProntas = await this.prisma.ordens_servico.findMany({
      where: {
        status: {
          in: [
            status_ordem_servico.pronto_para_retirada,
            status_ordem_servico.entregue,
          ],
        },
      },
      select: {
        id: true,
        status: true,
        clientes: {
          select: {
            nome: true,
          },
        },
      },
      orderBy: { updated_at: 'desc' },
      take: 50,
    });

    const states = await this.getWebhookStateMap(
      ordensProntas.map((ordem) => ordem.id),
    );

    const items = ordensProntas.map((ordem) => ({
      ordemId: ordem.id,
      customerName: ordem.clientes.nome,
      status: ordem.status,
      webhook: states.get(ordem.id) ?? this.buildEmptyWebhookState(true),
    }));

    return {
      totais: {
        enviadas: items.filter((item) => item.webhook.status === 'enviado')
          .length,
        pendentesReenvio: items.filter(
          (item) => item.webhook.status === 'pendente_reenvio',
        ).length,
        naoEnviadas: items.filter(
          (item) => item.webhook.status === 'nao_enviado',
        ).length,
        nuncaConfigurado: items.filter(
          (item) => item.webhook.status === 'nunca_configurado',
        ).length,
      },
      items,
    };
  }

  async retryOrderWebhook(ordemId: string) {
    const ordem = await this.prisma.ordens_servico.findUnique({
      where: { id: ordemId },
      include: {
        clientes: true,
      },
    });

    if (!ordem) {
      throw new NotFoundException('Ordem de servico nao encontrada.');
    }

    return this.dispatchOrdemServicoPronta({
      ordemId: ordem.id,
      clienteNome: ordem.clientes.nome,
      clienteTelefone: ordem.clientes.telefone,
      tipoEntrega: ordem.tipo_entrega,
      aparelhoMarca: ordem.aparelho_marca,
      aparelhoModelo: ordem.aparelho_modelo,
    });
  }

  async getWebhookStateMap(ordemIds: string[]) {
    const map = new Map<string, WebhookOrderState>();

    if (!ordemIds.length) {
      return map;
    }

    const configuracoesLoja = await this.configuracoesLojaService.getInternal();
    const isConfigured = Boolean(
      configuracoesLoja.ordem_pronta_webhook_url?.trim(),
    );
    const eventos = await this.prisma.webhook_eventos.findMany({
      where: {
        evento: 'ordem_servico_pronta',
        referencia_id: { in: ordemIds },
      },
      orderBy: [{ referencia_id: 'asc' }, { created_at: 'desc' }],
    });

    const historicoPorOrdem = eventos.reduce<Record<string, typeof eventos>>(
      (acc, evento) => {
        acc[evento.referencia_id] = [
          ...(acc[evento.referencia_id] ?? []),
          evento,
        ];
        return acc;
      },
      {},
    );

    for (const ordemId of ordemIds) {
      const historico = historicoPorOrdem[ordemId] ?? [];
      const latest = historico[0] ?? null;
      let status: WebhookOrderStateStatus = 'nao_enviado';

      if (!isConfigured) {
        status = 'nunca_configurado';
      } else if (!latest) {
        status = 'nao_enviado';
      } else if (latest.sucesso) {
        status = 'enviado';
      } else {
        status = 'pendente_reenvio';
      }

      map.set(ordemId, {
        configured: isConfigured,
        status,
        attempts: historico.length,
        latestAttemptAt: latest?.created_at ?? null,
        latestResponse: latest?.resposta ?? null,
        sentSuccessfully: latest?.sucesso ?? false,
      });
    }

    return map;
  }

  buildMensagemCliente(tipoEntrega: tipo_entrega_os) {
    if (tipoEntrega === tipo_entrega_os.entrega) {
      return 'seu conserto esta finalizado, nosso entregador ira realizar a entrega nas proximas horas';
    }

    return 'vc ja pode retirar na loja';
  }

  private buildEmptyWebhookState(configured: boolean): WebhookOrderState {
    return {
      configured,
      status: configured
        ? ('nao_enviado' as const)
        : ('nunca_configurado' as const),
      attempts: 0,
      latestAttemptAt: null,
      latestResponse: null,
      sentSuccessfully: false,
    };
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
      try {
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
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Erro desconhecido ao enviar webhook.';

        lastResponse = {
          ok: false,
          status: 0,
          summary: `NETWORK_ERROR [${url}] - ${message}`,
        };
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
