import { type FormEvent, useMemo, useState } from 'react';
import { CreditCard, Plus, ShoppingCart, X } from 'lucide-react';
import { PAYMENT_METHOD_LABELS } from '../lib/paymentMethods';
import { formatCurrency } from '../lib/utils';
import { PaymentMethod, Product, Sale, SaleFormValues } from '../types';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500';

const EMPTY_FORM: SaleFormValues = {
  customerName: '',
  paymentMethod: 'pix',
  selectedProductId: '',
  quantity: '1',
};

type SalesViewProps = {
  products: Product[];
  sales: Sale[];
  isBusy: boolean;
  onCreateSale: (values: SaleFormValues) => Promise<void>;
};

export const SalesView = ({
  products,
  sales,
  isBusy,
  onCreateSale,
}: SalesViewProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<SaleFormValues>(EMPTY_FORM);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === formData.selectedProductId),
    [formData.selectedProductId, products],
  );

  const totalPreview = useMemo(() => {
    if (!selectedProduct) {
      return 0;
    }
    const quantity = Number.parseInt(formData.quantity, 10);
    const normalizedQuantity = Number.isFinite(quantity) ? Math.max(quantity, 1) : 1;
    return selectedProduct.salePrice * normalizedQuantity;
  }, [formData.quantity, selectedProduct]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onCreateSale(formData);
    setFormData(EMPTY_FORM);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Registro de Vendas
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Registre vendas de acessórios e periféricos com baixa automática no estoque.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-100 transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 dark:shadow-blue-950/40 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isBusy}
        >
          <Plus size={18} />
          Registrar Venda
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sales.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            Nenhuma venda registrada ainda.
          </div>
        )}
        {sales.map((sale) => (
          <div
            key={sale.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <ShoppingCart size={18} />
                  <h4 className="font-bold">{sale.customerName}</h4>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Ref: {sale.reference} • {new Date(sale.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {PAYMENT_METHOD_LABELS[sale.paymentMethod]}
                </p>
                <p className="text-xl font-black text-slate-900 dark:text-slate-100">
                  {formatCurrency(sale.total)}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
              {sale.items.map((item) => (
                <div
                  key={`${sale.id}-${item.productId}`}
                  className="flex items-center justify-between gap-4 py-1 text-sm"
                >
                  <span className="text-slate-700 dark:text-slate-300">
                    {item.productName} x{item.quantity}
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Registrar Venda
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-200"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5 p-5">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Nome do Cliente
                </label>
                <input
                  value={formData.customerName}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      customerName: event.target.value,
                    }))
                  }
                  placeholder="Opcional"
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Produto
                  </label>
                  <select
                    required
                    value={formData.selectedProductId}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        selectedProductId: event.target.value,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="">Selecione um produto</option>
                    {products
                      .filter((product) => product.stock > 0)
                      .map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} - {formatCurrency(product.salePrice)} (Estoque:{' '}
                          {product.stock})
                        </option>
                      ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Quantidade
                  </label>
                  <input
                    required
                    min="1"
                    type="number"
                    value={formData.quantity}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        quantity: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Forma de Pagamento
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        paymentMethod: event.target.value as PaymentMethod,
                      }))
                    }
                    className={inputClass}
                  >
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <CreditCard size={16} />
                  Total previsto
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(totalPreview)}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isBusy}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-100 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Confirmar Venda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
