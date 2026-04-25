import { useEffect } from 'react';
import { ArrowRight, CalendarClock, Smartphone, UserRound, Wrench } from 'lucide-react';
import {
  ActionButton,
  FormModal,
  MetricCard,
  Panel,
} from './ui/primitives';
import {
  getNextServiceAction,
  serviceStatusBadgeClass,
  serviceStatusLabel,
  workflowColumns,
} from '../lib/serviceStatus';
import { cn, formatCurrency } from '../lib/utils';
import { ServiceOrder, ServiceStatus } from '../types';

type ServiceOrderDetailsModalProps = {
  isOpen: boolean;
  service: ServiceOrder | null;
  isBusy: boolean;
  onClose: () => void;
  onUpdateStatus: (service: ServiceOrder, status: ServiceStatus) => Promise<void>;
};

const detailCardClass =
  'rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950';

export const ServiceOrderDetailsModal = ({
  isOpen,
  service,
  isBusy,
  onClose,
  onUpdateStatus,
}: ServiceOrderDetailsModalProps) => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !service) {
    return null;
  }

  const nextAction = getNextServiceAction(service.status);
  const partsTotal = service.partsUsed.reduce((total, part) => total + part.subtotal, 0);
  const deliveryLabel =
    service.deliveryType === 'delivery' ? 'Entrega em endereco' : 'Retirada na loja';

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${service.customerName} - ${service.deviceBrand} ${service.deviceModel}`}
      description={`OS ${service.id} • ${serviceStatusLabel[service.status]}`}
      maxWidthClassName="max-w-5xl"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Cliente" value={service.customerName} icon={<UserRound size={16} />} />
          <MetricCard
            label="Aparelho"
            value={`${service.deviceBrand} ${service.deviceModel}`}
            icon={<Smartphone size={16} />}
          />
          <MetricCard
            label="Criada em"
            value={new Date(service.createdAt).toLocaleDateString('pt-BR')}
            icon={<CalendarClock size={16} />}
          />
          <MetricCard
            label="Total da OS"
            value={formatCurrency(service.totalPrice)}
            icon={<Wrench size={16} />}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_320px]">
          <div className="space-y-4">
            <Panel>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Resumo do atendimento
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className={detailCardClass}>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Contato</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {service.customerPhone || 'Nao informado'}
                  </div>
                </div>
                <div className={detailCardClass}>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Entrega</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {deliveryLabel}
                  </div>
                </div>
                <div className={detailCardClass}>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Atualizada em</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {new Date(service.updatedAt).toLocaleString('pt-BR')}
                  </div>
                </div>
                <div className={detailCardClass}>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Status</div>
                  <div className="mt-2">
                    <span
                      className={cn(
                        'inline-flex rounded-md px-2.5 py-1 text-xs font-semibold',
                        serviceStatusBadgeClass[service.status],
                      )}
                    >
                      {serviceStatusLabel[service.status]}
                    </span>
                  </div>
                </div>
              </div>
            </Panel>

            <Panel>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Defeito relatado
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {service.issueDescription}
              </p>
            </Panel>

            <Panel>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Pecas utilizadas
                </h3>
                <span className="text-sm tabular-nums text-slate-500 dark:text-slate-400">
                  {service.partsUsed.length}
                </span>
              </div>

              {service.partsUsed.length === 0 ? (
                <div className="mt-4 rounded-lg border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  Nenhuma peca vinculada a esta OS.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {service.partsUsed.map((part) => (
                    <div key={part.id} className={detailCardClass}>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {part.description}
                          </div>
                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Quantidade {part.quantity}
                          </div>
                        </div>
                        <div className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                          {formatCurrency(part.subtotal)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <div className="space-y-4">
            <Panel>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Resumo financeiro
              </h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Mao de obra</span>
                  <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {formatCurrency(service.laborCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Pecas</span>
                  <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {formatCurrency(partsTotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Lucro estimado</span>
                  <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {formatCurrency(service.estimatedProfit)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Saldo pendente</span>
                  <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {formatCurrency(service.pendingBalance)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-800">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    Total
                  </span>
                  <span className="text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {formatCurrency(service.totalPrice)}
                  </span>
                </div>
              </div>
            </Panel>

            <Panel>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Auditoria
              </h3>
              <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <div>
                  Criada por:{' '}
                  <span className="font-semibold">
                    {service.audit?.createdBy?.nome ?? 'Nao identificado'}
                  </span>
                </div>
                <div>
                  Tecnico:{' '}
                  <span className="font-semibold">
                    {service.audit?.technician?.nome ?? 'Nao atribuido'}
                  </span>
                </div>
                <div>
                  Entregue por:{' '}
                  <span className="font-semibold">
                    {service.audit?.deliveredBy?.nome ?? 'Ainda nao entregue'}
                  </span>
                </div>
              </div>
            </Panel>

            <Panel>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Webhook OS pronta
              </h3>
              <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {service.webhookPronto?.status ?? 'nao_enviado'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tentativas</span>
                  <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {service.webhookPronto?.attempts ?? 0}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {service.webhookPronto?.latestResponse || 'Sem historico de envio.'}
                </div>
              </div>
            </Panel>

            <Panel>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Atualizar status
              </h3>
              <div className="mt-4 space-y-3">
                {nextAction ? (
                  <ActionButton
                    variant="primary"
                    disabled={isBusy}
                    className="w-full"
                    onClick={() => void onUpdateStatus(service, nextAction.nextStatus)}
                  >
                    {nextAction.label}
                    <ArrowRight size={16} />
                  </ActionButton>
                ) : null}

                {service.status !== 'entregue' && service.status !== 'cancelada' ? (
                  <ActionButton
                    variant="danger"
                    disabled={isBusy}
                    className="w-full"
                    onClick={() => void onUpdateStatus(service, 'cancelada')}
                  >
                    Cancelar OS
                  </ActionButton>
                ) : null}

                <select
                  value={service.status}
                  disabled={isBusy}
                  onChange={(event) =>
                    void onUpdateStatus(service, event.target.value as ServiceStatus)
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  {workflowColumns.map((columnOption) => (
                    <option key={columnOption.id} value={columnOption.id}>
                      {columnOption.title}
                    </option>
                  ))}
                </select>
              </div>
            </Panel>
          </div>
        </div>

        <Panel>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Timeline da OS
          </h3>
          <div className="mt-4 space-y-3">
            {(service.timeline ?? []).slice(0, 6).map((item) => (
              <div key={item.id} className={detailCardClass}>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {item.title}
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {new Date(item.createdAt).toLocaleString('pt-BR')}
                  {item.actor ? ` - ${item.actor.nome}` : ''}
                </div>
                {item.description ? (
                  <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {item.description}
                  </div>
                ) : null}
              </div>
            ))}
            {(service.timeline ?? []).length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Sem eventos operacionais detalhados para esta OS.
              </div>
            ) : null}
          </div>
        </Panel>
      </div>
    </FormModal>
  );
};
