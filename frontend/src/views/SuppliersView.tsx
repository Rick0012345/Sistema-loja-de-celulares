import { type FormEvent, useMemo, useState } from 'react';
import { Edit2, Plus, Search, Trash2, X } from 'lucide-react';
import { Supplier, SupplierFormValues } from '../types';
import { cn, formatDateTime } from '../lib/utils';

const panelClass =
  'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm';
const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500';

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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            size={18}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por nome, contato, documento ou cidade"
            className={cn(inputClass, 'pl-10 pr-4 py-2 shadow-sm')}
          />
        </div>
        <button
          type="button"
          onClick={() => openModal()}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-100 transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:shadow-blue-950/40 dark:hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isBusy}
        >
          <Plus size={20} />
          Novo Fornecedor
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className={`${panelClass} rounded-2xl p-4`}>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Fornecedores ativos
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">
            {suppliers.filter((supplier) => supplier.isActive).length}
          </div>
        </div>
        <div className={`${panelClass} rounded-2xl p-4`}>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Com produtos vinculados
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">
            {
              suppliers.filter((supplier) => supplier.linkedProductsCount > 0).length
            }
          </div>
        </div>
        <div className={`${panelClass} rounded-2xl p-4`}>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Sem WhatsApp
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">
            {suppliers.filter((supplier) => !supplier.whatsapp).length}
          </div>
        </div>
      </div>

      <div className={cn('overflow-hidden rounded-2xl', panelClass)}>
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
              <th className="p-3.5 font-semibold text-slate-600 dark:text-slate-300">
                Fornecedor
              </th>
              <th className="p-3.5 font-semibold text-slate-600 dark:text-slate-300">
                Contato
              </th>
              <th className="p-3.5 font-semibold text-slate-600 dark:text-slate-300">
                Cidade
              </th>
              <th className="p-3.5 font-semibold text-slate-600 dark:text-slate-300">
                Vinculos
              </th>
              <th className="p-3.5 font-semibold text-slate-600 dark:text-slate-300">
                Atualizado
              </th>
              <th className="p-3.5 font-semibold text-slate-600 dark:text-slate-300">
                Status
              </th>
              <th className="p-3.5 text-right font-semibold text-slate-600 dark:text-slate-300">
                Acoes
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="p-5 text-center text-slate-500 dark:text-slate-400"
                >
                  Nenhum fornecedor encontrado com os filtros atuais.
                </td>
              </tr>
            )}
            {filteredSuppliers.map((supplier) => (
              <tr
                key={supplier.id}
                className="group border-b border-slate-100 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/70"
              >
                <td className="p-3.5">
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    {supplier.name}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">
                    {supplier.document || supplier.email || supplier.id}
                  </div>
                </td>
                <td className="p-3.5 text-sm text-slate-600 dark:text-slate-300">
                  <div>{supplier.phone || 'Telefone nao informado'}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">
                    WhatsApp: {supplier.whatsapp || 'Nao informado'}
                  </div>
                </td>
                <td className="p-3.5 text-sm text-slate-600 dark:text-slate-300">
                  {supplier.city || 'Nao informada'}
                </td>
                <td className="p-3.5 text-sm text-slate-600 dark:text-slate-300">
                  <div>{supplier.linkedProductsCount} produtos</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">
                    {supplier.linkedFinancialRecordsCount} registros financeiros
                  </div>
                </td>
                <td className="p-3.5 text-sm text-slate-600 dark:text-slate-300">
                  {formatDateTime(supplier.updatedAt)}
                </td>
                <td className="p-3.5">
                  <span
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-bold',
                      supplier.isActive
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
                    )}
                  >
                    {supplier.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="p-3.5 text-right">
                  <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => openModal(supplier)}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:text-slate-500 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void onDeleteSupplier(supplier)}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-rose-500/10"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-200"
              >
                <X size={24} />
              </button>
            </div>
            <form
              onSubmit={(event) => void handleSubmit(event)}
              className="space-y-5 overflow-y-auto p-5"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Nome
                  </label>
                  <input
                    required
                    value={formData.name}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Telefone
                  </label>
                  <input
                    value={formData.phone}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    WhatsApp
                  </label>
                  <input
                    value={formData.whatsapp}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        whatsapp: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Documento
                  </label>
                  <input
                    value={formData.document}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        document: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Cidade
                  </label>
                  <input
                    value={formData.city}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        city: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950">
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
                  <label
                    htmlFor="supplier-active"
                    className="text-sm font-semibold text-slate-600 dark:text-slate-300"
                  >
                    Fornecedor ativo
                  </label>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Observacoes
                  </label>
                  <textarea
                    rows={4}
                    value={formData.notes}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-100 transition-colors hover:bg-blue-700"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
