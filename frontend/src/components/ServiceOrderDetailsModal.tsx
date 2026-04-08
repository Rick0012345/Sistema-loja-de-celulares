import { useEffect } from 'react';
import { ArrowRight, CalendarClock, Smartphone, UserRound, Wrench, X } from 'lucide-react';
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
  'rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/80';

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
    service.deliveryType === 'delivery' ? 'Entrega em endereço' : 'Retirada na loja';

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-order-details-title"
        className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-950">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
              Ordem de serviço
            </div>
            <h3
              id="service-order-details-title"
              className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100"
            >
              {service.customerName} • {service.deviceBrand} {service.deviceModel}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                {service.id}
              </span>
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-bold',
                  serviceStatusBadgeClass[service.status],
                )}
              >
                {serviceStatusLabel[service.status]}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[calc(90vh-92px)] space-y-6 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className={detailCardClass}>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                <UserRound size={14} />
                Cliente
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {service.customerName}
              </div>
              <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {service.customerPhone || 'Não informado'}
              </div>
            </div>

            <div className={detailCardClass}>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                <Smartphone size={14} />
                Aparelho
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {service.deviceBrand} {service.deviceModel}
              </div>
              <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {deliveryLabel}
              </div>
            </div>

            <div className={detailCardClass}>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                <CalendarClock size={14} />
                Datas
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Criada em {new Date(service.createdAt).toLocaleDateString('pt-BR')}
              </div>
              <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Atualizada em {new Date(service.updatedAt).toLocaleString('pt-BR')}
              </div>
            </div>

            <div className={detailCardClass}>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                <Wrench size={14} />
                Financeiro
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Total {formatCurrency(service.totalPrice)}
              </div>
              <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Lucro estimado {formatCurrency(service.estimatedProfit)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_340px]">
            <div className="space-y-6">
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Defeito relatado
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {service.issueDescription}
                </p>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Peças utilizadas
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                    {service.partsUsed.length}
                  </span>
                </div>

                {service.partsUsed.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    Nenhuma peça vinculada a esta OS.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {service.partsUsed.map((part) => (
                      <div
                        key={part.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {part.description}
                            </div>
                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              Quantidade {part.quantity}
                            </div>
                          </div>
                          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {formatCurrency(part.subtotal)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Resumo financeiro
                </div>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>Mão de obra</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(service.laborCost)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>Peças</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(partsTotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>Lucro estimado</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(service.estimatedProfit)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-slate-900 dark:border-slate-800 dark:text-slate-100">
                    <span className="font-semibold">Total da OS</span>
                    <span className="text-lg font-black">
                      {formatCurrency(service.totalPrice)}
                    </span>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Atualizar status
                </div>

                <div className="mt-4 space-y-3">
                  {nextAction && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void onUpdateStatus(service, nextAction.nextStatus)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                    >
                      {nextAction.label}
                      <ArrowRight size={16} />
                    </button>
                  )}

                  {service.status !== 'entregue' && service.status !== 'cancelada' && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void onUpdateStatus(service, 'cancelada')}
                      className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
                    >
                      Cancelar OS
                    </button>
                  )}

                  <select
                    value={service.status}
                    disabled={isBusy}
                    onChange={(event) =>
                      void onUpdateStatus(service, event.target.value as ServiceStatus)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    {workflowColumns.map((columnOption) => (
                      <option key={columnOption.id} value={columnOption.id}>
                        {columnOption.title}
                      </option>
                    ))}
                  </select>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};
