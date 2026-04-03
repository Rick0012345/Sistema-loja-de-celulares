import { type FormEvent, useMemo, useState } from 'react';
import { AlertTriangle, Edit2, Plus, Search, Trash2, X } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { Product, ProductFormValues } from '../types';

const panelClass =
  'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm';
const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500';

const EMPTY_PRODUCT_FORM: ProductFormValues = {
  name: '',
  brand: '',
  compatibleModel: '',
  sku: '',
  costPrice: '',
  salePrice: '',
  stock: '',
  minStock: '',
};

type InventoryViewProps = {
  products: Product[];
  isBusy: boolean;
  onDeleteProduct: (product: Product) => Promise<void>;
  onSaveProduct: (
    values: ProductFormValues,
    product?: Product | null,
  ) => Promise<void>;
};

export const InventoryView = ({
  products,
  isBusy,
  onDeleteProduct,
  onSaveProduct,
}: InventoryViewProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<ProductFormValues>(EMPTY_PRODUCT_FORM);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      if (!normalizedSearch) return true;

      return [
        product.name,
        product.brand,
        product.compatibleModel,
        product.sku,
      ].some((value) => value.toLowerCase().includes(normalizedSearch));
    });
  }, [products, searchTerm]);

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        brand: product.brand,
        compatibleModel: product.compatibleModel,
        sku: product.sku,
        costPrice: product.costPrice.toString(),
        salePrice: product.salePrice.toString(),
        stock: product.stock.toString(),
        minStock: product.minStock.toString(),
      });
    } else {
      setEditingProduct(null);
      setFormData(EMPTY_PRODUCT_FORM);
    }

    setIsModalOpen(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onSaveProduct(formData, editingProduct);
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData(EMPTY_PRODUCT_FORM);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por nome, marca, modelo ou SKU"
            className={cn(inputClass, 'pl-10 pr-4 py-2 shadow-sm')}
          />
        </div>
        <button
          type="button"
          onClick={() => openModal()}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-100 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isBusy}
        >
          <Plus size={20} />
          Novo Produto
        </button>
      </div>

      <div className={cn('overflow-hidden rounded-2xl', panelClass)}>
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
              <th className="p-3.5 font-semibold text-slate-600 dark:text-slate-300">Produto</th>
              <th className="p-3.5 font-semibold text-slate-600 dark:text-slate-300">Marca / Modelo</th>
              <th className="p-3.5 font-semibold text-slate-600 dark:text-slate-300">Preco Custo</th>
              <th className="p-3.5 font-semibold text-slate-600 dark:text-slate-300">Preco Venda</th>
              <th className="p-3.5 font-semibold text-slate-600 dark:text-slate-300">Estoque</th>
              <th className="p-3.5 text-right font-semibold text-slate-600 dark:text-slate-300">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={6} className="p-5 text-center text-slate-500 dark:text-slate-400">
                  Nenhum produto encontrado com os filtros atuais.
                </td>
              </tr>
            )}
            {filteredProducts.map((product) => (
              <tr key={product.id} className="group border-b border-slate-100 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/70">
                <td className="p-3.5">
                  <div className="font-bold text-slate-900 dark:text-slate-100">{product.name}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">
                    {product.sku || product.id}
                  </div>
                </td>
                <td className="p-3.5 text-sm text-slate-600 dark:text-slate-300">
                  <div>{product.brand || 'Sem marca'}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">
                    {product.compatibleModel || 'Modelo nao informado'}
                  </div>
                </td>
                <td className="p-3.5 font-medium text-slate-600 dark:text-slate-300">{formatCurrency(product.costPrice)}</td>
                <td className="p-3.5 font-bold text-blue-600">{formatCurrency(product.salePrice)}</td>
                <td className="p-3.5">
                  <div className="flex items-center gap-2">
                    <span className={cn('font-bold', product.isLowStock ? 'text-rose-600' : 'text-slate-900 dark:text-slate-100')}>
                      {product.stock}
                    </span>
                    {product.isLowStock && <AlertTriangle size={14} className="text-rose-500" />}
                  </div>
                </td>
                <td className="p-3.5 text-right">
                  <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => openModal(product)}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:text-slate-500 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void onDeleteProduct(product)}
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
          <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-200"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5 overflow-y-auto p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Nome do Produto</label>
                  <input required value={formData.name} onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Marca</label>
                  <input value={formData.brand} onChange={(event) => setFormData((current) => ({ ...current, brand: event.target.value }))} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Modelo Compativel</label>
                  <input value={formData.compatibleModel} onChange={(event) => setFormData((current) => ({ ...current, compatibleModel: event.target.value }))} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">SKU</label>
                  <input value={formData.sku} onChange={(event) => setFormData((current) => ({ ...current, sku: event.target.value }))} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Estoque Atual</label>
                  <input required type="number" min="0" value={formData.stock} onChange={(event) => setFormData((current) => ({ ...current, stock: event.target.value }))} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Estoque Minimo</label>
                  <input required type="number" min="0" value={formData.minStock} onChange={(event) => setFormData((current) => ({ ...current, minStock: event.target.value }))} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Preco Custo (R$)</label>
                  <input required type="number" step="0.01" min="0" value={formData.costPrice} onChange={(event) => setFormData((current) => ({ ...current, costPrice: event.target.value }))} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Preco Venda (R$)</label>
                  <input required type="number" step="0.01" min="0" value={formData.salePrice} onChange={(event) => setFormData((current) => ({ ...current, salePrice: event.target.value }))} className={inputClass} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-100 transition-colors hover:bg-blue-700">
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
