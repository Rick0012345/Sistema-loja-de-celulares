import { type FormEvent, useMemo, useState } from 'react';
import { Edit2, Plus, Search, Trash2 } from 'lucide-react';
import {
  ActionButton,
  DataTable,
  EmptyState,
  FormModal,
  MetricCard,
  PageHeader,
  StatusBadge,
  Toolbar,
} from '../components/ui/primitives';
import { Supplier, SupplierFormValues } from '../types';
import { cn, formatDateTime } from '../lib/utils';

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';

const EMPTY_SUPPLIER_FORM: SupplierFormValues = {
  name: '',
  phone: '',
  whatsapp: '',
  email: '',
  document: '',
  city: '',
  notes: '',
  isActive: true,
};

type SuppliersViewProps = {
  suppliers: Supplier[];
  isBusy: boolean;
  onDeleteSupplier: (supplier: Supplier) => Promise<void>;
  onSaveSupplier: (
    values: SupplierFormValues,
    supplier?: Supplier | null,
  ) => Promise<void>;
};

export const SuppliersView = ({
  suppliers,
  isBusy,
  onDeleteSupplier,
  onSaveSupplier,
}: SuppliersViewProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<SupplierFormValues>(EMPTY_SUPPLIER_FORM);

  const filteredSuppliers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return suppliers.filter((supplier) => {
      if (!normalizedSearch) {
        return true;
      }

      return [
        supplier.name,
        supplier.phone ?? '',
        supplier.whatsapp ?? '',
        supplier.email ?? '',
        supplier.document ?? '',
        supplier.city ?? '',
      ].some((value) => value.toLowerCase().includes(normalizedSearch));
    });
  }, [searchTerm, suppliers]);

  const openModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        phone: supplier.phone ?? '',
        whatsapp: supplier.whatsapp ?? '',
        email: supplier.email ?? '',
        document: supplier.document ?? '',
        city: supplier.city ?? '',
        notes: supplier.notes ?? '',
        isActive: supplier.isActive,
      });
    } else {
      setEditingSupplier(null);
      setFormData(EMPTY_SUPPLIER_FORM);
    }

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
    setFormData(EMPTY_SUPPLIER_FORM);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onSaveSupplier(formData, editingSupplier);
    closeModal();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fornecedores"
        description="Cadastre e acompanhe parceiros de compra com leitura rápida e ações previsíveis."
      />

      <Toolbar>
        <div className="relative w-full max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            size={16}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por nome, contato, documento ou cidade"
            className={cn(inputClass, 'pl-9')}
          />
        </div>
        <ActionButton onClick={() => openModal()} variant="primary" disabled={isBusy}>
          <Plus size={16} />
          Novo fornecedor
        </ActionButton>
      </Toolbar>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard
          label="Fornecedores ativos"
          value={suppliers.filter((supplier) => supplier.isActive).length}
        />
        <MetricCard
          label="Com produtos vinculados"
          value={suppliers.filter((supplier) => supplier.linkedProductsCount > 0).length}
        />
        <MetricCard
          label="Sem WhatsApp"
          value={suppliers.filter((supplier) => !supplier.whatsapp).length}
          tone="warning"
        />
      </div>

      <DataTable>
        <div className="max-h-[min(60dvh,640px)] overflow-auto">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Fornecedor
                </th>
                <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Contato
                </th>
                <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Cidade
                </th>
                <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Vinculos
                </th>
                <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Atualizado
                </th>
                <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Status
                </th>
                <th className="p-3 text-right text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Acoes
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4">
                    <EmptyState
                      title="Nenhum fornecedor encontrado"
                      description="Ajuste a busca atual ou cadastre um novo fornecedor para continuar."
                      action={
                        <ActionButton onClick={() => openModal()} variant="primary">
                          <Plus size={16} />
                          Novo fornecedor
                        </ActionButton>
                      }
                    />
                  </td>
                </tr>
              ) : null}
              {filteredSuppliers.map((supplier) => (
                <tr
                  key={supplier.id}
                  className="border-b border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/70"
                >
                  <td className="p-3">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {supplier.name}
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {supplier.document || supplier.email || supplier.id}
                    </div>
                  </td>
                  <td className="p-3 text-sm text-slate-600 dark:text-slate-300">
                    <div>{supplier.phone || 'Telefone nao informado'}</div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      WhatsApp: {supplier.whatsapp || 'Nao informado'}
                    </div>
                  </td>
                  <td className="p-3 text-sm text-slate-600 dark:text-slate-300">
                    {supplier.city || 'Nao informada'}
                  </td>
                  <td className="p-3 text-sm text-slate-600 dark:text-slate-300">
                    <div className="tabular-nums">{supplier.linkedProductsCount} produtos</div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {supplier.linkedFinancialRecordsCount} registros financeiros
                    </div>
                  </td>
                  <td className="p-3 text-sm tabular-nums text-slate-600 dark:text-slate-300">
                    {formatDateTime(supplier.updatedAt)}
                  </td>
                  <td className="p-3">
                    <StatusBadge tone={supplier.isActive ? 'success' : 'neutral'}>
                      {supplier.isActive ? 'Ativo' : 'Inativo'}
                    </StatusBadge>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <ActionButton onClick={() => openModal(supplier)} className="px-2.5 py-2">
                        <Edit2 size={16} />
                      </ActionButton>
                      <ActionButton
                        onClick={() => void onDeleteSupplier(supplier)}
                        variant="danger"
                        className="px-2.5 py-2"
                      >
                        <Trash2 size={16} />
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataTable>

      <FormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingSupplier ? 'Editar fornecedor' : 'Novo fornecedor'}
        description="Preencha os dados principais para manter o cadastro consistente no operacional."
        footer={
          <div className="flex justify-end gap-2">
            <ActionButton onClick={closeModal} variant="secondary">
              Cancelar
            </ActionButton>
            <ActionButton type="submit" form="supplier-form" variant="primary">
              Salvar fornecedor
            </ActionButton>
          </div>
        }
      >
        <form
          id="supplier-form"
          onSubmit={(event) => void handleSubmit(event)}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Nome
            </span>
            <input
              required
              value={formData.name}
              onChange={(event) =>
                setFormData((current) => ({ ...current, name: event.target.value }))
              }
              className={inputClass}
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Telefone
            </span>
            <input
              value={formData.phone}
              onChange={(event) =>
                setFormData((current) => ({ ...current, phone: event.target.value }))
              }
              className={inputClass}
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              WhatsApp
            </span>
            <input
              value={formData.whatsapp}
              onChange={(event) =>
                setFormData((current) => ({ ...current, whatsapp: event.target.value }))
              }
              className={inputClass}
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              E-mail
            </span>
            <input
              type="email"
              value={formData.email}
              onChange={(event) =>
                setFormData((current) => ({ ...current, email: event.target.value }))
              }
              className={inputClass}
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Documento
            </span>
            <input
              value={formData.document}
              onChange={(event) =>
                setFormData((current) => ({ ...current, document: event.target.value }))
              }
              className={inputClass}
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Cidade
            </span>
            <input
              value={formData.city}
              onChange={(event) =>
                setFormData((current) => ({ ...current, city: event.target.value }))
              }
              className={inputClass}
            />
          </label>
          <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <input
              id="supplier-active"
              type="checkbox"
              checked={formData.isActive}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  isActive: event.target.checked,
                }))
              }
            />
            Fornecedor ativo
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Observacoes
            </span>
            <textarea
              rows={4}
              value={formData.notes}
              onChange={(event) =>
                setFormData((current) => ({ ...current, notes: event.target.value }))
              }
              className={inputClass}
            />
          </label>
        </form>
      </FormModal>
    </div>
  );
};
