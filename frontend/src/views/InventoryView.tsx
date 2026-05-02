import { type FormEvent, useMemo, useState } from 'react';
import { AlertTriangle, Edit2, Plus, Search, Trash2 } from 'lucide-react';
import {
  ActionButton,
  DataTable,
  EmptyState,
  FormModal,
  PageHeader,
  StatusBadge,
  TableHeaderCell,
  Toolbar,
  inputClassName,
} from '../components/ui/primitives';
import { useSessionStorageState } from '../hooks/useSessionStorageState';
import { cn, formatCurrency } from '../lib/utils';
import { Product, ProductFormValues, Supplier } from '../types';

const EMPTY_PRODUCT_FORM: ProductFormValues = {
  name: '',
  brand: '',
  compatibleModel: '',
  sku: '',
  inventoryType: 'repair',
  supplierId: '',
  costPrice: '',
  salePrice: '',
  stock: '',
  minStock: '',
};

type InventoryViewProps = {
  appMode: 'repair' | 'sales';
  products: Product[];
  suppliers: Supplier[];
  isBusy: boolean;
  onDeleteProduct: (product: Product) => Promise<void>;
  onSaveProduct: (
    values: ProductFormValues,
    product?: Product | null,
  ) => Promise<void>;
};

export const InventoryView = ({
  appMode,
  products,
  suppliers,
  isBusy,
  onDeleteProduct,
  onSaveProduct,
}: InventoryViewProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useSessionStorageState(
    `inventory-search-${appMode}`,
    '',
  );
  const [stockFilter, setStockFilter] = useSessionStorageState<
    'all' | 'low_stock'
  >(`inventory-stock-filter-${appMode}`, 'all');
  const [formData, setFormData] = useState<ProductFormValues>(EMPTY_PRODUCT_FORM);
  const lowStockCount = products.filter((product) => product.isLowStock).length;
  const totalUnits = products.reduce((total, product) => total + product.stock, 0);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const matchesStock =
        stockFilter === 'all' ? true : product.stock <= product.minStock;
      if (!normalizedSearch) return matchesStock;

      const matchesSearch = [
        product.name,
        product.brand,
        product.compatibleModel,
        product.sku,
      ].some((value) => value.toLowerCase().includes(normalizedSearch));

      return matchesStock && matchesSearch;
    });
  }, [products, searchTerm, stockFilter]);

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        brand: product.brand,
        compatibleModel: product.compatibleModel,
        sku: product.sku,
        inventoryType:
          product.inventoryType === 'uncategorized'
            ? appMode
            : product.inventoryType,
        supplierId: product.preferredSupplier?.id ?? '',
        costPrice: product.costPrice.toString(),
        salePrice: product.salePrice.toString(),
        stock: product.stock.toString(),
        minStock: product.minStock.toString(),
      });
    } else {
      setEditingProduct(null);
      setFormData({
        ...EMPTY_PRODUCT_FORM,
        inventoryType: appMode,
      });
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
    <div className="space-y-5">
      <PageHeader
        title="Estoque"
        eyebrow={appMode === 'repair' ? 'Peças e manutenção' : 'Produtos para venda'}
        description="Controle produtos, fornecedores e itens críticos com leitura direta para reposição, preço e cadastro."
        metrics={[
          { label: 'Produtos', value: products.length },
          { label: 'Unidades', value: totalUnits },
          { label: 'Críticos', value: lowStockCount },
        ]}
      />

      <Toolbar>
        <div className="grid w-full gap-3 lg:grid-cols-[minmax(280px,420px)_180px_auto] lg:items-center">
          <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por nome, marca, modelo ou SKU"
            className={cn(inputClassName, 'py-2 pl-10 pr-4')}
          />
        </label>
          <select
            value={stockFilter}
            onChange={(event) =>
              setStockFilter(event.target.value as 'all' | 'low_stock')
            }
            className={inputClassName}
          >
            <option value="all">Todo o estoque</option>
            <option value="low_stock">Somente críticos</option>
          </select>
          {(searchTerm || stockFilter !== 'all') && (
            <ActionButton
              onClick={() => {
                setSearchTerm('');
                setStockFilter('all');
              }}
            >
              Limpar filtros
            </ActionButton>
          )}
        </div>
        <ActionButton onClick={() => openModal()} variant="primary" disabled={isBusy} className="lg:ml-auto">
          <Plus size={16} />
          Novo produto
        </ActionButton>
      </Toolbar>

      <DataTable>
        <div className="max-h-[min(60vh,640px)] overflow-auto">
          <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-slate-200 bg-slate-50/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
              <TableHeaderCell>Produto</TableHeaderCell>
              <TableHeaderCell>Marca / Modelo</TableHeaderCell>
              <TableHeaderCell>Fornecedor</TableHeaderCell>
              <TableHeaderCell>Preço custo</TableHeaderCell>
              <TableHeaderCell>Preço venda</TableHeaderCell>
              <TableHeaderCell>Estoque</TableHeaderCell>
              <TableHeaderCell className="text-right">Ações</TableHeaderCell>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={7} className="p-5">
                  <EmptyState
                    title="Nenhum produto encontrado"
                    description="Ajuste os filtros atuais ou cadastre um novo item para continuar."
                    action={
                      <ActionButton onClick={() => openModal()} variant="primary">
                        <Plus size={16} />
                        Novo produto
                      </ActionButton>
                    }
                  />
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
                    {product.compatibleModel || 'Modelo não informado'}
                  </div>
                </td>
                <td className="p-3.5 text-sm text-slate-600 dark:text-slate-300">
                  <div>{product.preferredSupplier?.name || 'Não definido'}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">
                    {product.preferredSupplier?.phone || 'Sem contato'}
                  </div>
                </td>
                <td className="p-3.5 font-medium text-slate-600 dark:text-slate-300">{formatCurrency(product.costPrice)}</td>
                <td className="p-3.5 font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(product.salePrice)}</td>
                <td className="p-3.5">
                  <div className="flex items-center gap-2">
                    <span className={cn('font-bold tabular-nums', product.isLowStock ? 'text-rose-600' : 'text-slate-900 dark:text-slate-100')}>
                      {product.stock}
                    </span>
                    {product.isLowStock && <AlertTriangle size={14} className="text-rose-500" />}
                    {product.isLowStock && <StatusBadge tone="danger">Abaixo do mínimo</StatusBadge>}
                  </div>
                </td>
                <td className="p-3.5 text-right">
                  <div className="flex justify-end gap-2">
                    <ActionButton
                      aria-label={`Editar ${product.name}`}
                      onClick={() => openModal(product)}
                      className="px-2.5 py-2"
                    >
                      <Edit2 size={18} />
                    </ActionButton>
                    <ActionButton
                      aria-label={`Excluir ${product.name}`}
                      onClick={() => void onDeleteProduct(product)}
                      variant="danger"
                      className="px-2.5 py-2"
                    >
                      <Trash2 size={18} />
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
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Editar produto' : 'Novo produto'}
        description="Preencha os dados principais de compra, venda e estoque para manter o cadastro consistente."
        maxWidthClassName="max-w-xl"
        footer={
          <div className="flex justify-end gap-2">
            <ActionButton onClick={() => setIsModalOpen(false)} variant="secondary">
              Cancelar
            </ActionButton>
            <ActionButton type="submit" form="inventory-form" variant="primary">
              Salvar produto
            </ActionButton>
          </div>
        }
      >
            <form id="inventory-form" onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Nome do Produto</label>
                  <input required value={formData.name} onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))} className={inputClassName} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Marca</label>
                  <input value={formData.brand} onChange={(event) => setFormData((current) => ({ ...current, brand: event.target.value }))} className={inputClassName} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Modelo compatível</label>
                  <input value={formData.compatibleModel} onChange={(event) => setFormData((current) => ({ ...current, compatibleModel: event.target.value }))} className={inputClassName} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Tipo de estoque</label>
                  <select
                    value={formData.inventoryType}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        inventoryType: event.target.value as ProductFormValues['inventoryType'],
                      }))
                    }
                    className={inputClassName}
                  >
                    <option value="repair">Conserto / OS</option>
                    <option value="sales">Venda</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">SKU</label>
                  <input value={formData.sku} onChange={(event) => setFormData((current) => ({ ...current, sku: event.target.value }))} className={inputClassName} />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Fornecedor preferencial</label>
                  <select
                    value={formData.supplierId}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        supplierId: event.target.value,
                      }))
                    }
                    className={inputClassName}
                  >
                    <option value="">Nenhum fornecedor vinculado</option>
                    {suppliers
                      .filter((supplier) => supplier.isActive)
                      .map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                          {supplier.phone ? ` - ${supplier.phone}` : ''}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Estoque atual</label>
                  <input required type="number" min="0" value={formData.stock} onChange={(event) => setFormData((current) => ({ ...current, stock: event.target.value }))} className={inputClassName} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Estoque mínimo</label>
                  <input required type="number" min="0" value={formData.minStock} onChange={(event) => setFormData((current) => ({ ...current, minStock: event.target.value }))} className={inputClassName} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Preço custo (R$)</label>
                  <input required type="number" step="0.01" min="0" value={formData.costPrice} onChange={(event) => setFormData((current) => ({ ...current, costPrice: event.target.value }))} className={inputClassName} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Preço venda (R$)</label>
                  <input required type="number" step="0.01" min="0" value={formData.salePrice} onChange={(event) => setFormData((current) => ({ ...current, salePrice: event.target.value }))} className={inputClassName} />
                </div>
              </div>
            </form>
      </FormModal>
    </div>
  );
};
