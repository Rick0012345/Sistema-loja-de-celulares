import { type FormEvent, useMemo, useState } from 'react';
import { CheckCircle, Clock, Pencil, Plus, Search, Smartphone, Trash2, X } from 'lucide-react';
import {
  getNextServiceAction,
  serviceStatusBadgeClass,
  serviceStatusLabel,
  serviceStatusOptions,
} from '../lib/serviceStatus';
import { emitServiceOrderReceiptPdf } from '../lib/receiptPdf';
import { cn, formatCurrency, formatPhone } from '../lib/utils';
import { Product, ServiceFormValues, ServiceOrder, ServiceStatus } from '../types';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500';
const secondaryButtonClass =
  'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors';

const EMPTY_SERVICE_FORM: ServiceFormValues = {
  customerName: '',
  customerPhone: '',
  deviceBrand: '',
  deviceModel: '',
  issueDescription: '',
  deliveryType: 'store_pickup',
  laborCost: '',
  parts: [],
};

const hasValidPhoneDigits = (value: string) => {
  const digits = value.replace(/\D/g, '');
  return digits.length === 10 || digits.length === 11;
};

const REPAIR_CATEGORY_KEYWORDS = [
  'conserto',
  'assistencia',
  'assistência',
  'reparo',
  'manutencao',
  'manutenção',
  'peca',
  'peça',
  'celular',
  'smartphone',
  'telefone',
];

const isRepairProduct = (product: Product) => {
  if (product.inventoryType === 'repair') {
    return true;
  }

  if (product.inventoryType === 'sales') {
    return false;
  }

  const category = product.categoryName.trim().toLowerCase();
  if (category.length > 0) {
    return REPAIR_CATEGORY_KEYWORDS.some((keyword) => category.includes(keyword));
  }

  const haystack = [
    product.name,
    product.brand,
    product.compatibleModel,
    product.sku,
  ]
    .join(' ')
    .toLowerCase();

  return REPAIR_CATEGORY_KEYWORDS.some((keyword) => haystack.includes(keyword));
};

type ServicesViewProps = {
  products: Product[];
  services: ServiceOrder[];
  isBusy: boolean;
  onCreateService: (values: ServiceFormValues) => Promise<void>;
  onUpdateService: (serviceId: string, values: ServiceFormValues) => Promise<void>;
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
};

export const ServicesView = ({
  products,
  services,
  isBusy,
  onCreateService,
  onRequestPaymentMethod,
  onUpdateService,
  onUpdateServiceStatus,
}: ServicesViewProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | ServiceStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<ServiceFormValues>(EMPTY_SERVICE_FORM);
  const [partSearchTerm, setPartSearchTerm] = useState('');
  const [partSelectionError, setPartSelectionError] = useState('');
  const [selectedPartProductId, setSelectedPartProductId] = useState('');
  const [selectedPartQuantity, setSelectedPartQuantity] = useState('1');

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

  const repairProducts = useMemo(
    () => products.filter((product) => product.stock > 0 && isRepairProduct(product)),
    [products],
  );

  const filteredRepairProducts = useMemo(() => {
    const normalizedPartSearch = partSearchTerm.trim().toLowerCase();

    if (!normalizedPartSearch) {
      return repairProducts;
    }

    return repairProducts.filter((product) =>
      [
        product.name,
        product.brand,
        product.compatibleModel,
        product.sku,
        product.categoryName,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedPartSearch),
    );
  }, [partSearchTerm, repairProducts]);

  const selectedRepairProduct = useMemo(
    () => repairProducts.find((product) => product.id === selectedPartProductId),
    [repairProducts, selectedPartProductId],
  );

  const isPhoneValid =
    formData.customerPhone.trim().length === 0 ||
    hasValidPhoneDigits(formData.customerPhone);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingServiceId(null);
    setFormData(EMPTY_SERVICE_FORM);
    setPartSearchTerm('');
    setPartSelectionError('');
    setSelectedPartProductId('');
    setSelectedPartQuantity('1');
  };

  const openCreateModal = () => {
    setEditingServiceId(null);
    setFormData(EMPTY_SERVICE_FORM);
    setIsModalOpen(true);
  };

  const openEditModal = (service: ServiceOrder) => {
    setEditingServiceId(service.id);
    setFormData({
      customerName: service.customerName,
      customerPhone: formatPhone(service.customerPhone),
      deviceBrand: service.deviceBrand,
      deviceModel: service.deviceModel,
      issueDescription: service.issueDescription,
      deliveryType: service.deliveryType,
      laborCost: service.laborCost.toString(),
      parts: service.partsUsed.map((part) => ({
        id: part.id,
        productId: part.productId ?? '',
        description: part.description,
        quantity: part.quantity.toString(),
        costPrice: part.costPrice.toString(),
        salePrice: part.salePrice.toString(),
      })),
    });
    setIsModalOpen(true);
  };

  const updatePart = (
    index: number,
    updater: (current: ServiceFormValues['parts'][number]) => ServiceFormValues['parts'][number],
  ) => {
    setFormData((current) => ({
      ...current,
      parts: current.parts.map((part, partIndex) =>
        partIndex === index ? updater(part) : part,
      ),
    }));
  };

  const addPart = () => {
    setFormData((current) => ({
      ...current,
      parts: [
        ...current.parts,
        {
          productId: '',
          description: '',
          quantity: '1',
          costPrice: '0',
          salePrice: '0',
        },
      ],
    }));
  };

  const addSelectedPart = () => {
    if (!selectedPartProductId) {
      setPartSelectionError('Selecione um produto de conserto para adicionar.');
      return;
    }

    const selectedProduct = repairProducts.find(
      (product) => product.id === selectedPartProductId,
    );

    if (!selectedProduct) {
      setPartSelectionError('Produto selecionado nao encontrado no estoque de conserto.');
      return;
    }

    const quantity = Number.parseInt(selectedPartQuantity, 10);
    const normalizedQuantity = Number.isFinite(quantity) ? Math.max(quantity, 1) : 1;

    setFormData((current) => {
      const existingIndex = current.parts.findIndex(
        (part) => part.productId === selectedPartProductId,
      );

      if (existingIndex >= 0) {
        const updatedParts = [...current.parts];
        const currentQuantity = Number.parseInt(updatedParts[existingIndex].quantity, 10);
        const mergedQuantity =
          (Number.isFinite(currentQuantity) ? Math.max(currentQuantity, 1) : 1) +
          normalizedQuantity;

        updatedParts[existingIndex] = {
          ...updatedParts[existingIndex],
          quantity: String(Math.min(mergedQuantity, selectedProduct.stock)),
          description: selectedProduct.name,
          costPrice: selectedProduct.costPrice.toString(),
          salePrice: selectedProduct.salePrice.toString(),
        };

        return { ...current, parts: updatedParts };
      }

      return {
        ...current,
        parts: [
          ...current.parts,
          {
            productId: selectedProduct.id,
            description: selectedProduct.name,
            quantity: String(Math.min(normalizedQuantity, selectedProduct.stock)),
            costPrice: selectedProduct.costPrice.toString(),
            salePrice: selectedProduct.salePrice.toString(),
          },
        ],
      };
    });

    setPartSelectionError('');
    setSelectedPartQuantity('1');
  };

  const removePart = (index: number) => {
    setFormData((current) => ({
      ...current,
      parts: current.parts.filter((_, partIndex) => partIndex !== index),
    }));
  };

  const handleStatusUpdate = async (service: ServiceOrder, status: ServiceStatus) => {
    if (status === service.status) {
      return;
    }

    if (status === 'entregue') {
      const paymentMethod = await onRequestPaymentMethod({
        title: 'Concluir entrega da OS',
        description: `${service.customerName} • ${service.deviceBrand} ${service.deviceModel}`,
        amount: service.totalPrice,
        defaultValue: 'pix',
        confirmLabel: 'Receber e concluir entrega',
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

  const handleEmitServiceReceipt = (service: ServiceOrder) => {
    try {
      emitServiceOrderReceiptPdf({
        id: service.id,
        customerName: service.customerName,
        customerPhone: service.customerPhone,
        deviceBrand: service.deviceBrand,
        deviceModel: service.deviceModel,
        deliveryTypeLabel:
          service.deliveryType === 'delivery' ? 'Entrega em endereco' : 'Retirada na loja',
        statusLabel: serviceStatusLabel[service.status],
        issueDescription: service.issueDescription,
        laborCost: service.laborCost,
        total: service.totalPrice,
        createdAt: service.createdAt,
        parts: service.partsUsed.map((part) => ({
          description: part.description,
          quantity: part.quantity,
          unitPrice: part.salePrice,
          subtotal: part.subtotal,
        })),
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Nao foi possivel emitir o recibo desta ordem de servico.';
      window.alert(message);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isPhoneValid) {
      return;
    }
    if (editingServiceId) {
      await onUpdateService(editingServiceId, formData);
      closeModal();
      return;
    }

    await onCreateService(formData);
    closeModal();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:ml-auto">
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value === 'all' ? 'all' : (event.target.value as ServiceStatus))
            }
            className={inputClass}
          >
            <option value="all">Todos os status</option>
            {serviceStatusOptions.map((statusOption) => (
              <option key={statusOption.id} value={statusOption.id}>
                {statusOption.title}
              </option>
            ))}
          </select>
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
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-100 transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 dark:shadow-blue-950/40 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isBusy}
        >
          <Plus size={20} />
          Nova Ordem de Servico
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredServices.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            Nenhuma ordem de servico encontrada com os filtros atuais.
          </div>
        )}

        {filteredServices.map((service) => {
          const nextAction = getNextServiceAction(service.status);

          return (
            <div key={service.id} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/30">
              <div className="flex justify-between gap-4">
                <div className="flex gap-4">
                  <div className="rounded-2xl bg-slate-50 p-3 text-slate-400 transition-colors group-hover:text-blue-500 dark:bg-slate-950 dark:text-slate-500">
                    <Smartphone size={28} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {service.deviceBrand} {service.deviceModel}
                      </h4>
                      <span className={cn('rounded-full px-3 py-1 text-xs font-bold', serviceStatusBadgeClass[service.status])}>
                        {serviceStatusLabel[service.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Cliente: <span className="font-semibold text-slate-700 dark:text-slate-200">{service.customerName}</span> • {service.customerPhone}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {service.pendingBalance > 0 && (
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                          Saldo pendente {formatCurrency(service.pendingBalance)}
                        </span>
                      )}
                      {service.readyWithoutContactSent && (
                        <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                          Pronta sem contato enviado
                        </span>
                      )}
                    </div>
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
                  <div className="text-xl font-black text-slate-900 dark:text-slate-100">
                    {formatCurrency(service.totalPrice)}
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(service)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <span className="flex items-center gap-1.5">
                        <Pencil size={13} />
                        Editar OS
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEmitServiceReceipt(service)}
                      className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
                    >
                      Emitir recibo OS (PDF)
                    </button>
                    {service.status !== 'entregue' && service.status !== 'cancelada' && (
                      <button
                        type="button"
                        onClick={() => void handleStatusUpdate(service, 'cancelada')}
                        className="rounded-xl bg-rose-50 px-4 py-2 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-100 dark:bg-rose-500/15 dark:text-rose-300 dark:hover:bg-rose-500/20"
                      >
                        Cancelar OS
                      </button>
                    )}
                    {nextAction && (
                      <button
                        type="button"
                        onClick={() => void handleStatusUpdate(service, nextAction.nextStatus)}
                        className={cn(
                          'rounded-xl px-4 py-2 text-xs font-bold transition-colors',
                          service.status === 'aguardando_orcamento' &&
                            'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:hover:bg-blue-500/20',
                          service.status === 'aguardando_aprovacao' &&
                            'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:hover:bg-amber-500/20',
                          service.status === 'aguardando_peca' &&
                            'bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-500/15 dark:text-orange-300 dark:hover:bg-orange-500/20',
                          service.status === 'em_conserto' &&
                            'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/20',
                          service.status === 'pronto_para_retirada' &&
                            'bg-indigo-600 text-white hover:bg-indigo-700',
                        )}
                      >
                        {nextAction.label}
                      </button>
                    )}
                    <select
                      value={service.status}
                      onChange={(event) =>
                        void handleStatusUpdate(service, event.target.value as ServiceStatus)
                      }
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                      {serviceStatusOptions.map((statusOption) => (
                        <option key={statusOption.id} value={statusOption.id}>
                          {statusOption.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-5 -mx-5 -mb-5 flex items-center justify-between rounded-b-2xl border-t border-slate-50 bg-slate-50/50 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-950/70">
                <div className="text-sm italic text-slate-600 dark:text-slate-300">
                  "{service.issueDescription}"
                </div>
                {service.status === 'pronto_para_retirada' && (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                    <CheckCircle size={14} />
                    {service.deliveryType === 'delivery'
                      ? 'Aguardando entrega'
                      : 'Aguardando retirada'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {editingServiceId ? 'Editar Ordem de Servico' : 'Nova Ordem de Servico'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-200"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5 overflow-y-auto p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Nome do Cliente</label>
                  <input required value={formData.customerName} onChange={(event) => setFormData((current) => ({ ...current, customerName: event.target.value }))} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Telefone</label>
                  <input
                    required
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        customerPhone: formatPhone(event.target.value),
                      }))
                    }
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="(00) 00000-0000"
                    title="Use o formato (XX) 0000-0000 até (XX) 00000000-0000"
                    maxLength={15}
                    className={inputClass}
                  />
                  {!isPhoneValid && (
                    <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                      Use o formato (XX) 0000-0000 ou (XX) 00000-0000.
                    </p>
                  )}
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
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Devolucao</label>
                  <select value={formData.deliveryType} onChange={(event) => setFormData((current) => ({ ...current, deliveryType: event.target.value as ServiceFormValues['deliveryType'] }))} className={inputClass}>
                    <option value="store_pickup">Retirada na loja</option>
                    <option value="delivery">Entrega</option>
                  </select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Descricao do Problema</label>
                  <textarea required rows={2} value={formData.issueDescription} onChange={(event) => setFormData((current) => ({ ...current, issueDescription: event.target.value }))} className={inputClass} />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Peças / itens</label>
                    <button
                      type="button"
                      onClick={addPart}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Adicionar item manual
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 p-3 dark:border-slate-800 sm:grid-cols-2">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Buscar produto de conserto
                      </label>
                      <input
                        value={partSearchTerm}
                        onChange={(event) => setPartSearchTerm(event.target.value)}
                        placeholder="Nome, marca, modelo, SKU ou categoria"
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Produtos disponiveis
                      </label>
                      <div className="max-h-52 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-950">
                        {filteredRepairProducts.length === 0 && (
                          <p className="px-2 py-3 text-sm text-slate-500 dark:text-slate-400">
                            Nenhum produto de conserto encontrado.
                          </p>
                        )}
                        {filteredRepairProducts.map((product) => {
                          const isSelected = selectedPartProductId === product.id;
                          return (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => {
                                setSelectedPartProductId(product.id);
                                setPartSelectionError('');
                              }}
                              className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200'
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10'
                              }`}
                            >
                              <p className="text-sm font-semibold">{product.name}</p>
                              <p className="text-xs opacity-80">
                                {formatCurrency(product.salePrice)} • Estoque: {product.stock}
                                {product.categoryName ? ` • ${product.categoryName}` : ''}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                      {selectedRepairProduct && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Selecionado:{' '}
                          <span className="font-semibold">{selectedRepairProduct.name}</span>
                        </p>
                      )}
                      {partSelectionError && (
                        <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                          {partSelectionError}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Quantidade
                      </label>
                      <input
                        min="1"
                        type="number"
                        value={selectedPartQuantity}
                        onChange={(event) => setSelectedPartQuantity(event.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={addSelectedPart}
                        className="w-full rounded-xl bg-slate-800 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-300"
                      >
                        Adicionar produto
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {formData.parts.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                        Nenhum item adicionado.
                      </div>
                    )}
                    {formData.parts.map((part, index) => (
                      <div key={part.id ?? `part-${index}`} className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 p-3 dark:border-slate-800 sm:grid-cols-2">
                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Produto vinculado</label>
                          <select
                            value={part.productId}
                            onChange={(event) => {
                              const selectedProduct = repairProducts.find(
                                (product) => product.id === event.target.value,
                              );
                              updatePart(index, (current) => ({
                                ...current,
                                productId: event.target.value,
                                description: selectedProduct?.name ?? current.description,
                                costPrice: selectedProduct
                                  ? selectedProduct.costPrice.toString()
                                  : current.costPrice,
                                salePrice: selectedProduct
                                  ? selectedProduct.salePrice.toString()
                                  : current.salePrice,
                              }));
                            }}
                            className={inputClass}
                          >
                            <option value="">Item manual</option>
                            {repairProducts.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name} - {formatCurrency(product.salePrice)} (Estoque: {product.stock})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Descrição</label>
                          <input
                            required
                            value={part.description}
                            onChange={(event) =>
                              updatePart(index, (current) => ({
                                ...current,
                                description: event.target.value,
                              }))
                            }
                            className={inputClass}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Quantidade</label>
                          <input
                            min="1"
                            type="number"
                            value={part.quantity}
                            onChange={(event) =>
                              updatePart(index, (current) => ({
                                ...current,
                                quantity: event.target.value,
                              }))
                            }
                            className={inputClass}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Custo unitário</label>
                          <input
                            min="0"
                            step="0.01"
                            type="number"
                            value={part.costPrice}
                            onChange={(event) =>
                              updatePart(index, (current) => ({
                                ...current,
                                costPrice: event.target.value,
                              }))
                            }
                            className={inputClass}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Venda unitária</label>
                          <input
                            min="0"
                            step="0.01"
                            type="number"
                            value={part.salePrice}
                            onChange={(event) =>
                              updatePart(index, (current) => ({
                                ...current,
                                salePrice: event.target.value,
                              }))
                            }
                            className={inputClass}
                          />
                        </div>
                        <div className="flex items-end justify-end">
                          <button
                            type="button"
                            onClick={() => removePart(index)}
                            className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-100 dark:bg-rose-500/15 dark:text-rose-300 dark:hover:bg-rose-500/20"
                          >
                            <span className="flex items-center gap-1.5">
                              <Trash2 size={14} />
                              Remover
                            </span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-100 transition-colors hover:bg-blue-700">
                  {editingServiceId ? 'Salvar alteracoes' : 'Gerar OS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
