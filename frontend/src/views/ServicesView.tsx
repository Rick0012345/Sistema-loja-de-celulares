import { type FormEvent, useMemo, useState } from 'react';
import { CheckCircle, Clock, Plus, Search, Smartphone, X } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { Product, ServiceFormValues, ServiceOrder, ServiceStatus } from '../types';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500';
const secondaryButtonClass =
  'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors';

const EMPTY_SERVICE_FORM: ServiceFormValues = {
  customerName: '',
  customerPhone: '',
  deviceBrand: '',
  deviceModel: '',
  issueDescription: '',
  laborCost: '',
  selectedPartId: '',
  partQuantity: '1',
};

const statusBadgeClass: Record<ServiceStatus, string> = {
  pending: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
  in_progress: 'bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-300',
  ready: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
  delivered: 'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300',
  cancelled: 'bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300',
};

const statusLabel: Record<ServiceStatus, string> = {
  pending: 'Pendente',
  in_progress: 'Em Conserto',
  ready: 'Pronto',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

type ServicesViewProps = {
  products: Product[];
  services: ServiceOrder[];
  isBusy: boolean;
  onCreateService: (values: ServiceFormValues) => Promise<void>;
  onUpdateServiceStatus: (serviceId: string, status: ServiceStatus) => Promise<void>;
};

export const ServicesView = ({
  products,
  services,
  isBusy,
  onCreateService,
  onUpdateServiceStatus,
}: ServicesViewProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'ready'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<ServiceFormValues>(EMPTY_SERVICE_FORM);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredServices = useMemo(
    () =>
      services.filter((service) => {
        const matchesStatus =
          statusFilter === 'all' ? true : service.status === statusFilter;
        const matchesSearch =
          normalizedSearch.length === 0
            ? true
            : [
                service.id,
                service.customerName,
                service.customerPhone,
                service.deviceBrand,
                service.deviceModel,
                service.issueDescription,
              ].some((value) => value.toLowerCase().includes(normalizedSearch));

        return matchesStatus && matchesSearch;
      }),
    [normalizedSearch, services, statusFilter],
  );

  const filterOptions = [
    { id: 'all', label: 'Todos', count: services.length },
    {
      id: 'pending',
      label: 'Pendentes',
      count: services.filter((service) => service.status === 'pending').length,
    },
    {
      id: 'ready',
      label: 'Prontos',
      count: services.filter((service) => service.status === 'ready').length,
    },
  ] as const;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onCreateService(formData);
    setFormData(EMPTY_SERVICE_FORM);
    setIsModalOpen(false);
  };

  const getNextAction = (status: ServiceStatus) => {
    if (status === 'pending') {
      return { label: 'Iniciar Conserto', nextStatus: 'in_progress' as const };
    }

    if (status === 'in_progress') {
      return { label: 'Marcar como Pronto', nextStatus: 'ready' as const };
    }

    if (status === 'ready') {
      return { label: 'Entregar ao Cliente', nextStatus: 'delivered' as const };
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-3">
          {filterOptions.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setStatusFilter(filter.id)}
              className={cn(
                secondaryButtonClass,
                statusFilter === filter.id &&
                  'border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300',
              )}
            >
              {filter.label}
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                {filter.count}
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:ml-auto">
          <label className="relative block">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por cliente, aparelho ou OS"
              className="min-w-[280px] rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </label>
          {(statusFilter !== 'all' || normalizedSearch.length > 0) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setSearchTerm('');
              }}
              className={secondaryButtonClass}
            >
              Limpar filtros
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2 font-semibold text-white shadow-lg shadow-blue-100 transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 dark:shadow-blue-950/40 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isBusy}
        >
          <Plus size={20} />
          Nova Ordem de Servico
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredServices.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            Nenhuma ordem de servico encontrada com os filtros atuais.
          </div>
        )}

        {filteredServices.map((service) => {
          const nextAction = getNextAction(service.status);

          return (
            <div key={service.id} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/30">
              <div className="flex justify-between gap-4">
                <div className="flex gap-4">
                  <div className="rounded-2xl bg-slate-50 p-4 text-slate-400 transition-colors group-hover:text-blue-500 dark:bg-slate-950 dark:text-slate-500">
                    <Smartphone size={32} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {service.deviceBrand} {service.deviceModel}
                      </h4>
                      <span className={cn('rounded-full px-3 py-1 text-xs font-bold', statusBadgeClass[service.status])}>
                        {statusLabel[service.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Cliente: <span className="font-semibold text-slate-700 dark:text-slate-200">{service.customerName}</span> • {service.customerPhone}
                    </p>
                    <div className="mt-3 flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {new Date(service.createdAt).toLocaleString('pt-BR')}
                      </span>
                      <span className="font-mono font-bold">{service.id}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                    {formatCurrency(service.totalPrice)}
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    {nextAction && (
                      <button
                        type="button"
                        onClick={() => void onUpdateServiceStatus(service.id, nextAction.nextStatus)}
                        className={cn(
                          'rounded-xl px-4 py-2 text-xs font-bold transition-colors',
                          service.status === 'pending' &&
                            'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:hover:bg-blue-500/20',
                          service.status === 'in_progress' &&
                            'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/20',
                          service.status === 'ready' &&
                            'bg-indigo-600 text-white hover:bg-indigo-700',
                        )}
                      >
                        {nextAction.label}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 -mx-6 -mb-6 flex items-center justify-between rounded-b-2xl border-t border-slate-50 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/70">
                <div className="text-sm italic text-slate-600 dark:text-slate-300">
                  "{service.issueDescription}"
                </div>
                {service.status === 'ready' && (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                    <CheckCircle size={14} />
                    Aguardando retirada
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Nova Ordem de Servico</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-200"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-6 p-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Nome do Cliente</label>
                  <input required value={formData.customerName} onChange={(event) => setFormData((current) => ({ ...current, customerName: event.target.value }))} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Telefone</label>
                  <input required value={formData.customerPhone} onChange={(event) => setFormData((current) => ({ ...current, customerPhone: event.target.value }))} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Marca do Aparelho</label>
                  <input required value={formData.deviceBrand} onChange={(event) => setFormData((current) => ({ ...current, deviceBrand: event.target.value }))} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Modelo do Aparelho</label>
                  <input required value={formData.deviceModel} onChange={(event) => setFormData((current) => ({ ...current, deviceModel: event.target.value }))} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Mao de Obra (R$)</label>
                  <input required type="number" step="0.01" min="0" value={formData.laborCost} onChange={(event) => setFormData((current) => ({ ...current, laborCost: event.target.value }))} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Quantidade da Peca</label>
                  <input type="number" min="1" value={formData.partQuantity} onChange={(event) => setFormData((current) => ({ ...current, partQuantity: event.target.value }))} className={inputClass} />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Descricao do Problema</label>
                  <textarea required rows={2} value={formData.issueDescription} onChange={(event) => setFormData((current) => ({ ...current, issueDescription: event.target.value }))} className={inputClass} />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Peca Utilizada (Opcional)</label>
                  <select value={formData.selectedPartId} onChange={(event) => setFormData((current) => ({ ...current, selectedPartId: event.target.value }))} className={inputClass}>
                    <option value="">Nenhuma peca</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {formatCurrency(product.salePrice)} (Estoque: {product.stock})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 rounded-xl border border-slate-200 py-3 font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold text-white shadow-lg shadow-blue-100 transition-colors hover:bg-blue-700">
                  Gerar OS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
