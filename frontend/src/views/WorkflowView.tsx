import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Clock,
  LayoutGrid,
  List,
  PackageCheck,
  RotateCw,
  Search,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { EmptyState, MetricCard, PageHeader } from '../components/ui/primitives';
import { ServiceOrderDetailsModal } from '../components/ServiceOrderDetailsModal';
import { useSessionStorageState } from '../hooks/useSessionStorageState';
import { cn, formatCurrency } from '../lib/utils';
import {
  getNextServiceAction,
  isOpenServiceStatus,
  serviceStatusBadgeClass,
  serviceStatusLabel,
} from '../lib/serviceStatus';
import { DashboardSummary, ServiceOrder, ServiceStatus } from '../types';

type WorkflowViewProps = {
  services: ServiceOrder[];
  summary: DashboardSummary | null;
  isBusy: boolean;
  onLoadServiceDetails: (serviceId: string) => Promise<ServiceOrder | null>;
  onRequestPaymentMethod: (input: {
    title: string;
    description: string;
    amount?: number | null;
    defaultValue?: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'transferencia';
    confirmLabel?: string;
  }) => Promise<
    'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'transferencia' | null
  >;
  onUpdateServiceStatus: (inputId: string, input: {
    status: ServiceStatus;
    paymentMethod?: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'transferencia';
  }) => Promise<void>;
  onRetryWebhook: (serviceId: string) => Promise<void>;
};

type WorkflowColumn = {
  id: string;
  title: string;
  description: string;
  icon: typeof Clock;
  statuses: ServiceStatus[];
  tone: string;
};

const workflowBoardColumns: WorkflowColumn[] = [
  {
    id: 'pending',
    title: 'Tarefas pendentes',
    description: 'Orçamento, aprovação e peça',
    icon: ClipboardList,
    statuses: ['aguardando_orcamento', 'aguardando_aprovacao', 'aguardando_peca'],
    tone: 'border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900',
  },
  {
    id: 'process',
    title: 'OS em processo',
    description: 'Serviços em bancada',
    icon: Wrench,
    statuses: ['em_conserto'],
    tone: 'border-blue-300 bg-blue-50/70 dark:border-blue-500/30 dark:bg-blue-500/10',
  },
  {
    id: 'verification',
    title: 'OS em verificação',
    description: 'Prontas para contato e retirada',
    icon: ShieldCheck,
    statuses: ['pronto_para_retirada'],
    tone: 'border-amber-300 bg-amber-50/70 dark:border-amber-500/30 dark:bg-amber-500/10',
  },
  {
    id: 'done',
    title: 'OS concluídas',
    description: 'Entregues ou canceladas',
    icon: CheckCircle2,
    statuses: ['entregue', 'cancelada'],
    tone: 'border-emerald-300 bg-emerald-50/70 dark:border-emerald-500/30 dark:bg-emerald-500/10',
  },
];

const statusProgress: Record<ServiceStatus, number> = {
  aguardando_orcamento: 15,
  aguardando_aprovacao: 30,
  aguardando_peca: 45,
  em_conserto: 65,
  pronto_para_retirada: 85,
  entregue: 100,
  cancelada: 100,
};

export const WorkflowView = ({
  services,
  summary,
  isBusy,
  onLoadServiceDetails,
  onRequestPaymentMethod,
  onUpdateServiceStatus,
  onRetryWebhook,
}: WorkflowViewProps) => {
  const [searchTerm, setSearchTerm] = useSessionStorageState('workflow-search', '');
  const [viewMode, setViewMode] = useSessionStorageState<'kanban' | 'lista'>(
    'workflow-view-mode',
    'kanban',
  );
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedServiceDetails, setSelectedServiceDetails] = useState<ServiceOrder | null>(
    null,
  );

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const visibleServices = useMemo(
    () =>
      services.filter((service) => {
        if (normalizedSearch.length === 0) return true;

        return [
          service.id,
          service.customerName,
          service.customerPhone,
          service.deviceBrand,
          service.deviceModel,
          service.issueDescription,
        ].some((value) => value.toLowerCase().includes(normalizedSearch));
      }),
    [normalizedSearch, services],
  );

  const sortedServices = useMemo(
    () =>
      [...visibleServices].sort(
        (first, second) =>
          new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime(),
      ),
    [visibleServices],
  );

  const servicesByColumn = useMemo(
    () =>
      workflowBoardColumns.reduce(
        (accumulator, column) => ({
          ...accumulator,
          [column.id]: sortedServices.filter((service) =>
            column.statuses.includes(service.status),
          ),
        }),
        {} as Record<string, ServiceOrder[]>,
      ),
    [sortedServices],
  );

  const selectedService = useMemo(
    () =>
      selectedServiceDetails ??
      services.find((service) => service.id === selectedServiceId) ??
      null,
    [selectedServiceDetails, selectedServiceId, services],
  );

  useEffect(() => {
    if (!selectedServiceId) {
      setSelectedServiceDetails(null);
      return;
    }

    let active = true;
    void onLoadServiceDetails(selectedServiceId).then((service) => {
      if (active) {
        setSelectedServiceDetails(service);
      }
    });

    return () => {
      active = false;
    };
  }, [onLoadServiceDetails, selectedServiceId]);

  const metrics = useMemo(() => {
    const openOrders = visibleServices.filter((service) => isOpenServiceStatus(service.status));
    const readyOrders = visibleServices.filter(
      (service) => service.status === 'pronto_para_retirada',
    );
    const inProgressOrders = visibleServices.filter(
      (service) => service.status === 'em_conserto',
    );
    const deliveredRevenue = visibleServices
      .filter((service) => service.status === 'entregue')
      .reduce((total, service) => total + service.totalPrice, 0);

    return {
      openOrders: openOrders.length,
      readyOrders: readyOrders.length,
      inProgressOrders: inProgressOrders.length,
      deliveredRevenue,
      pendingBalances: readyOrders.filter((service) => service.pendingBalance > 0).length,
      webhookFailures: readyOrders.filter(
        (service) => service.webhookPronto?.status === 'pendente_reenvio',
      ).length,
    };
  }, [visibleServices]);

  const handleStatusUpdate = async (service: ServiceOrder, status: ServiceStatus) => {
    if (status === service.status) {
      return;
    }

    if (status === 'entregue') {
      const paymentMethod = await onRequestPaymentMethod({
        title: 'Receber antes da entrega',
        description: `${service.customerName} - ${service.deviceBrand} ${service.deviceModel}`,
        amount: service.totalPrice,
        defaultValue: 'pix',
        confirmLabel: 'Receber e marcar como entregue',
      });

      if (!paymentMethod) {
        return;
      }

      await onUpdateServiceStatus(service.id, {
        status,
        paymentMethod,
      });
      return;
    }

    await onUpdateServiceStatus(service.id, { status });
  };

  const openServiceDetails = (serviceId: string) => {
    setSelectedServiceId(serviceId);
  };

  const closeServiceDetails = () => {
    setSelectedServiceId(null);
    setSelectedServiceDetails(null);
  };

  const renderServiceCard = (service: ServiceOrder) => {
    const nextAction = getNextServiceAction(service.status);
    const progress = statusProgress[service.status];

    return (
      <button
        key={service.id}
        type="button"
        onClick={() => openServiceDetails(service.id)}
        aria-haspopup="dialog"
        className="group rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/90 dark:hover:border-slate-700"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-blue-600 dark:text-blue-300">
              OS {service.id.slice(0, 8)}
            </p>
            <h4 className="mt-1 truncate text-sm font-semibold text-slate-950 dark:text-white">
              {service.customerName}
            </h4>
          </div>
          <span
            className={cn(
              'shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold',
              serviceStatusBadgeClass[service.status],
            )}
          >
            {serviceStatusLabel[service.status]}
          </span>
        </div>

        <p className="mt-2 truncate text-sm font-medium text-slate-700 dark:text-slate-200">
          {service.deviceBrand} {service.deviceModel}
        </p>
        <p className="mt-1 line-clamp-2 min-h-10 text-sm text-slate-500 dark:text-slate-400">
          {service.issueDescription}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-md bg-slate-50 px-2 py-1.5 dark:bg-slate-900">
            <p className="text-[11px] font-semibold uppercase text-slate-400">Total</p>
            <p className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
              {formatCurrency(service.totalPrice)}
            </p>
          </div>
          <div className="rounded-md bg-slate-50 px-2 py-1.5 dark:bg-slate-900">
            <p className="text-[11px] font-semibold uppercase text-slate-400">Peças</p>
            <p className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
              {service.partsUsed.length}
            </p>
          </div>
        </div>

        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Progresso</span>
            <span className="font-semibold tabular-nums">{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={cn(
                'h-full rounded-full',
                service.status === 'cancelada' ? 'bg-rose-500' : 'bg-blue-500',
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <CalendarDays size={13} />
            {new Date(service.updatedAt).toLocaleDateString('pt-BR')}
          </span>
          {service.pendingBalance > 0 && (
            <span className="font-semibold text-amber-600 dark:text-amber-300">
              Saldo {formatCurrency(service.pendingBalance)}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          {nextAction ? (
            <span
              onClick={(event) => {
                event.stopPropagation();
                void handleStatusUpdate(service, nextAction.nextStatus);
              }}
              className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
            >
              {nextAction.label}
              <ArrowRight size={13} />
            </span>
          ) : (
            <span className="text-xs font-semibold text-slate-400">Sem próxima ação</span>
          )}

          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-white">
            Detalhes
            <ChevronRight size={14} />
          </span>
        </div>

        {service.status === 'pronto_para_retirada' &&
          service.webhookPronto?.status === 'pendente_reenvio' && (
            <span
              onClick={(event) => {
                event.stopPropagation();
                void onRetryWebhook(service.id);
              }}
              className="mt-2 inline-flex cursor-pointer items-center gap-1 rounded-md bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
            >
              <RotateCw size={13} />
              Reenviar webhook
            </span>
          )}
      </button>
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Fluxo operacional"
        eyebrow="Kanban da assistência"
        description="Visualize todas as etapas da OS, acompanhe gargalos e alterne para lista quando precisar de leitura executiva."
        metrics={[
          { label: 'Abertas', value: metrics.openOrders },
          { label: 'Em bancada', value: metrics.inProgressOrders },
          { label: 'Prontas', value: metrics.readyOrders },
          { label: 'Falhas webhook', value: metrics.webhookFailures },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="OS em aberto" value={metrics.openOrders} icon={<Activity size={15} />} />
        <MetricCard label="Na bancada" value={metrics.inProgressOrders} icon={<Wrench size={15} />} />
        <MetricCard label="Aguardando retirada" value={metrics.readyOrders} icon={<PackageCheck size={15} />} />
        <MetricCard label="Faturado entregue" value={formatCurrency(metrics.deliveredRevenue)} icon={<CircleDollarSign size={15} />} />
      </div>

      {summary && summary.operationalQueue.length > 0 && (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
            <div className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              OS prontas com saldo
            </div>
            <div className="mt-1 text-3xl font-semibold tabular-nums text-amber-900 dark:text-amber-100">
              {metrics.pendingBalances}
            </div>
          </div>
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 dark:border-rose-500/30 dark:bg-rose-500/10">
            <div className="text-sm font-semibold text-rose-800 dark:text-rose-200">
              Webhooks com falha
            </div>
            <div className="mt-1 text-3xl font-semibold tabular-nums text-rose-900 dark:text-rose-100">
              {metrics.webhookFailures}
            </div>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-500/30 dark:bg-blue-500/10">
            <div className="text-sm font-semibold text-blue-800 dark:text-blue-200">
              Aguardando fornecedor
            </div>
            <div className="mt-1 text-3xl font-semibold tabular-nums text-blue-900 dark:text-blue-100">
              {summary.operationalQueue.filter((item) => item.waitingSupplierItem).length}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-3 lg:grid-cols-[auto_minmax(280px,460px)_auto] lg:items-center">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors',
                viewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100',
              )}
            >
              <LayoutGrid size={16} />
              Kanban
            </button>
            <button
              type="button"
              onClick={() => setViewMode('lista')}
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors',
                viewMode === 'lista'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100',
              )}
            >
              <List size={16} />
              Lista
            </button>
          </div>

          <label className="relative block">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar cliente, aparelho, defeito ou número da OS"
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {visibleServices.length} OS
            </span>
            {normalizedSearch.length > 0 && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                Limpar busca
              </button>
            )}
          </div>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <div className="overflow-x-auto pb-2">
          <div className="grid min-w-[1180px] grid-cols-4 gap-4">
            {workflowBoardColumns.map((column) => {
              const columnServices = servicesByColumn[column.id] ?? [];
              const Icon = column.icon;

              return (
                <section
                  key={column.id}
                  className={cn(
                    'flex h-[min(72vh,760px)] min-h-[520px] flex-col rounded-xl border p-3',
                    column.tone,
                  )}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="rounded-lg bg-white p-2 text-slate-600 shadow-sm dark:bg-slate-950 dark:text-slate-300">
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                          {column.title}
                        </h3>
                        <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                          {column.description}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold tabular-nums text-slate-600 shadow-sm dark:bg-slate-950 dark:text-slate-300">
                      {columnServices.length}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
                    {columnServices.length === 0 && (
                      <EmptyState
                        title="Sem OS nesta etapa"
                        description="As ordens aparecem aqui conforme avançam no fluxo."
                      />
                    )}
                    {columnServices.map((service) => renderServiceCard(service))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_170px_150px_130px_120px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-400 lg:grid">
            <span>Cliente</span>
            <span>Aparelho e defeito</span>
            <span>Status</span>
            <span>Atualização</span>
            <span>Valor</span>
            <span>Ação</span>
          </div>

          {sortedServices.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
              Nenhuma ordem de serviço encontrada para os filtros atuais.
            </div>
          ) : (
            <div className="max-h-[min(70vh,760px)] divide-y divide-slate-200 overflow-y-auto dark:divide-slate-800">
              {sortedServices.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => openServiceDetails(service.id)}
                  aria-haspopup="dialog"
                  className="grid w-full gap-4 px-4 py-4 text-left transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-950/70 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_170px_150px_130px_120px] lg:items-center lg:px-5"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {service.customerName}
                    </div>
                    <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {service.customerPhone || 'Não informado'}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {service.deviceBrand} {service.deviceModel}
                    </div>
                    <p className="mt-1 line-clamp-1 text-sm text-slate-500 dark:text-slate-400">
                      {service.issueDescription}
                    </p>
                  </div>

                  <div>
                    <span
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-semibold',
                        serviceStatusBadgeClass[service.status],
                      )}
                    >
                      {serviceStatusLabel[service.status]}
                    </span>
                  </div>

                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    <div className="font-semibold text-slate-700 dark:text-slate-200">
                      {new Date(service.updatedAt).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="mt-1">
                      {new Date(service.updatedAt).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  <div className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {formatCurrency(service.totalPrice)}
                    {service.pendingBalance > 0 && (
                      <div className="mt-1 text-xs font-semibold text-amber-600">
                        Saldo {formatCurrency(service.pendingBalance)}
                      </div>
                    )}
                  </div>

                  <div className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Detalhes
                    <ChevronRight size={16} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <ServiceOrderDetailsModal
        isOpen={selectedService !== null}
        service={selectedService}
        isBusy={isBusy}
        onClose={closeServiceDetails}
        onUpdateStatus={handleStatusUpdate}
      />
    </div>
  );
};
