import { type FormEvent, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CreditCard,
  Package,
  Plus,
  ReceiptText,
  ShoppingCart,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { StatCard } from '../components/StatCard';
import { PAYMENT_METHOD_LABELS } from '../lib/paymentMethods';
import { emitReceiptPdf } from '../lib/receiptPdf';
import { formatCurrency } from '../lib/utils';
import { PaymentMethod, Product, Sale, SaleFormValues } from '../types';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500';

const EMPTY_FORM: SaleFormValues = {
  customerName: '',
  paymentMethod: 'pix',
  items: [],
};

const PIE_COLORS = ['#2563eb', '#22c55e', '#f59e0b', '#7c3aed', '#ef4444'];

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
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productSelectionError, setProductSelectionError] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState('1');

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId),
    [products, selectedProductId],
  );

  const totalPreview = useMemo(() => {
    return formData.items.reduce((sum, item) => {
      const product = products.find((current) => current.id === item.productId);
      if (!product) {
        return sum;
      }
      const quantity = Number.parseInt(item.quantity, 10);
      const normalizedQuantity = Number.isFinite(quantity) ? Math.max(quantity, 1) : 1;
      return sum + product.salePrice * normalizedQuantity;
    }, 0);
  }, [formData.items, products]);

  const filteredProducts = useMemo(() => {
    const search = productSearchTerm.trim().toLowerCase();
    const availableProducts = products.filter((product) => product.stock > 0);

    if (!search) {
      return availableProducts;
    }

    return availableProducts.filter((product) =>
      [product.name, product.brand, product.compatibleModel, product.sku]
        .join(' ')
        .toLowerCase()
        .includes(search),
    );
  }, [productSearchTerm, products]);

  const salesDashboard = useMemo(() => {
    const now = new Date();
    const monthRevenue = sales
      .filter((sale) => {
        const createdAt = new Date(sale.createdAt);
        return (
          createdAt.getMonth() === now.getMonth() &&
          createdAt.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, sale) => sum + sale.total, 0);

    const todayKey = format(now, 'yyyy-MM-dd');
    const todayRevenue = sales
      .filter((sale) => format(new Date(sale.createdAt), 'yyyy-MM-dd') === todayKey)
      .reduce((sum, sale) => sum + sale.total, 0);

    const totalUnits = sales.reduce(
      (sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0,
    );

    const avgTicket =
      sales.length > 0
        ? sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length
        : 0;

    const dailyRevenue = Array.from({ length: 7 }).map((_, index) => {
      const date = subDays(now, 6 - index);
      const key = format(date, 'yyyy-MM-dd');
      const name = format(date, 'dd/MM');
      const revenue = sales
        .filter((sale) => format(new Date(sale.createdAt), 'yyyy-MM-dd') === key)
        .reduce((sum, sale) => sum + sale.total, 0);
      return { name, revenue };
    });

    const paymentAccumulator = sales.reduce(
      (acc, sale) => {
        if (!acc[sale.paymentMethod]) {
          acc[sale.paymentMethod] = {
            method: sale.paymentMethod,
            total: 0,
            count: 0,
          };
        }
        acc[sale.paymentMethod].total += sale.total;
        acc[sale.paymentMethod].count += 1;
        return acc;
      },
      {} as Record<
        PaymentMethod,
        {
          method: PaymentMethod;
          total: number;
          count: number;
        }
      >,
    );

    const paymentData = Object.values(paymentAccumulator)
      .sort((a, b) => b.total - a.total)
      .map((item) => ({
        ...item,
        label: PAYMENT_METHOD_LABELS[item.method],
        share: monthRevenue > 0 ? (item.total / monthRevenue) * 100 : 0,
      }));

    const productAccumulator = sales.reduce(
      (acc, sale) => {
        sale.items.forEach((item) => {
          if (!acc[item.productId]) {
            acc[item.productId] = {
              productId: item.productId,
              productName: item.productName,
              units: 0,
              revenue: 0,
            };
          }
          acc[item.productId].units += item.quantity;
          acc[item.productId].revenue += item.subtotal;
        });
        return acc;
      },
      {} as Record<
        string,
        {
          productId: string;
          productName: string;
          units: number;
          revenue: number;
        }
      >,
    );

    const topProducts = Object.values(productAccumulator)
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);

    const soldProductIds = new Set(Object.keys(productAccumulator));
    const criticalStockProducts = products.filter(
      (product) => soldProductIds.has(product.id) && product.stock <= product.minStock,
    );

    return {
      monthRevenue,
      todayRevenue,
      avgTicket,
      totalUnits,
      dailyRevenue,
      paymentData,
      topProducts,
      criticalStockProducts,
    };
  }, [products, sales]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!formData.items.length) {
      setProductSelectionError('Selecione um produto para continuar.');
      return;
    }
    await onCreateSale(formData);
    setFormData(EMPTY_FORM);
    setSelectedProductId('');
    setSelectedQuantity('1');
    setProductSearchTerm('');
    setProductSelectionError('');
    setIsModalOpen(false);
  };

  const addSelectedProduct = () => {
    if (!selectedProductId) {
      setProductSelectionError('Selecione um produto para adicionar.');
      return;
    }

    const quantity = Number.parseInt(selectedQuantity, 10);
    const normalizedQuantity = Number.isFinite(quantity) ? Math.max(quantity, 1) : 1;
    const product = products.find((item) => item.id === selectedProductId);

    if (!product) {
      setProductSelectionError('Produto selecionado nao encontrado.');
      return;
    }

    setFormData((current) => {
      const existingIndex = current.items.findIndex(
        (item) => item.productId === selectedProductId,
      );

      if (existingIndex >= 0) {
        const updatedItems = [...current.items];
        const currentQuantity = Number.parseInt(updatedItems[existingIndex].quantity, 10);
        const mergedQuantity =
          (Number.isFinite(currentQuantity) ? Math.max(currentQuantity, 1) : 1) +
          normalizedQuantity;
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          quantity: String(Math.min(mergedQuantity, product.stock)),
        };
        return { ...current, items: updatedItems };
      }

      return {
        ...current,
        items: [
          ...current.items,
          {
            productId: selectedProductId,
            quantity: String(Math.min(normalizedQuantity, product.stock)),
          },
        ],
      };
    });

    setProductSelectionError('');
    setSelectedQuantity('1');
  };

  const removeSaleItem = (productId: string) => {
    setFormData((current) => ({
      ...current,
      items: current.items.filter((item) => item.productId !== productId),
    }));
  };

  const updateSaleItemQuantity = (productId: string, quantity: string) => {
    setFormData((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item,
      ),
    }));
  };

  const handleEmitReceipt = (sale: Sale) => {
    try {
      emitReceiptPdf({
        reference: sale.reference,
        customerName: sale.customerName,
        paymentMethodLabel: PAYMENT_METHOD_LABELS[sale.paymentMethod],
        total: sale.total,
        createdAt: sale.createdAt,
        items: sale.items.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        })),
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Nao foi possivel emitir o recibo desta venda.';
      window.alert(message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Dashboard de Vendas
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Painel exclusivo com performance comercial, mix de pagamento e produtos com maior giro.
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Faturamento do mes"
          value={formatCurrency(salesDashboard.monthRevenue)}
          icon={Wallet}
          color="blue"
        />
        <StatCard
          title="Vendido hoje"
          value={formatCurrency(salesDashboard.todayRevenue)}
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Ticket medio"
          value={formatCurrency(salesDashboard.avgTicket)}
          icon={ReceiptText}
          color="amber"
        />
        <StatCard
          title="Itens vendidos"
          value={salesDashboard.totalUnits.toString()}
          icon={Package}
          color="rose"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-2">
          <h4 className="mb-4 text-base font-bold text-slate-900 dark:text-slate-100">
            Faturamento dos ultimos 7 dias
          </h4>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesDashboard.dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="revenue" fill="#2563eb" radius={[8, 8, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h4 className="mb-4 text-base font-bold text-slate-900 dark:text-slate-100">
            Mix por pagamento
          </h4>
          {salesDashboard.paymentData.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
              Sem vendas para analisar.
            </p>
          ) : (
            <>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={salesDashboard.paymentData}
                      dataKey="total"
                      nameKey="label"
                      innerRadius={45}
                      outerRadius={76}
                      paddingAngle={4}
                    >
                      {salesDashboard.paymentData.map((entry, index) => (
                        <Cell key={entry.method} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-2">
                {salesDashboard.paymentData.map((item, index) => (
                  <div
                    key={item.method}
                    className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm dark:border-slate-800"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                      />
                      <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {item.share.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-2">
          <h4 className="mb-4 text-base font-bold text-slate-900 dark:text-slate-100">
            Produtos mais vendidos
          </h4>
          {salesDashboard.topProducts.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
              Nenhum produto vendido ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {salesDashboard.topProducts.map((product, index) => (
                <div
                  key={product.productId}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {product.productName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {product.units} unidades vendidas
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(product.revenue)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h4 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
            <AlertTriangle size={18} className="text-amber-500" />
            Alertas de reposicao
          </h4>
          {salesDashboard.criticalStockProducts.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
              Estoque sob controle para os itens vendidos.
            </p>
          ) : (
            <div className="space-y-2">
              {salesDashboard.criticalStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-500/30 dark:bg-amber-500/10"
                >
                  <p className="font-semibold text-amber-700 dark:text-amber-300">
                    {product.name}
                  </p>
                  <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
                    Estoque: {product.stock} | Minimo: {product.minStock}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sales.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            Nenhuma venda registrada ainda.
          </div>
        )}
        {sales.length > 0 && (
          <div className="max-h-[min(60vh,720px)] space-y-4 overflow-y-auto pr-1">
            <div className="sticky top-0 z-10 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 text-sm shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {sales.length} vendas registradas
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Histórico pronto para consulta rápida e emissão de recibo.
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                Ticket médio: {formatCurrency(salesDashboard.avgTicket)}
              </span>
            </div>
            {sales.map((sale) => (
              <div
                key={sale.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
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
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => handleEmitReceipt(sale)}
                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
              >
                Emitir recibo (PDF)
              </button>
            </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex h-[min(92vh,780px)] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Registrar Venda
              </h3>
              <button
                type="button"
                onClick={() => {
                  setSelectedProductId('');
                  setSelectedQuantity('1');
                  setProductSearchTerm('');
                  setProductSelectionError('');
                  setFormData(EMPTY_FORM);
                  setIsModalOpen(false);
                }}
                className="text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-200"
              >
                <X size={24} />
              </button>
            </div>
            <form
              onSubmit={(event) => void handleSubmit(event)}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
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
                    Buscar Produto
                  </label>
                  <input
                    value={productSearchTerm}
                    onChange={(event) => setProductSearchTerm(event.target.value)}
                    placeholder="Nome, marca, modelo ou SKU"
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Produto
                  </label>
                  <div className="max-h-52 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-950">
                    {filteredProducts.length === 0 && (
                      <p className="px-2 py-3 text-sm text-slate-500 dark:text-slate-400">
                        Nenhum produto encontrado.
                      </p>
                    )}
                    {filteredProducts.map((product) => {
                      const isSelected = selectedProductId === product.id;
                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => {
                            setSelectedProductId(product.id);
                            setProductSelectionError('');
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
                          </p>
                        </button>
                      );
                    })}
                  </div>
                  {selectedProductId && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Selecionado:{' '}
                      <span className="font-semibold">
                        {products.find((product) => product.id === selectedProductId)?.name}
                      </span>
                    </p>
                  )}
                  {productSelectionError && (
                    <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                      {productSelectionError}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Quantidade
                  </label>
                  <input
                    min="1"
                    type="number"
                    value={selectedQuantity}
                    onChange={(event) => setSelectedQuantity(event.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={addSelectedProduct}
                    className="w-full rounded-xl bg-slate-800 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-300"
                  >
                    Adicionar produto
                  </button>
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
              <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Itens da venda
                </p>
                {formData.items.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Nenhum produto adicionado.
                  </p>
                ) : (
                  formData.items.map((item) => {
                    const product = products.find((current) => current.id === item.productId);
                    if (!product) {
                      return null;
                    }
                    return (
                      <div
                        key={item.productId}
                        className="grid grid-cols-[1fr_90px_28px] items-center gap-2"
                      >
                        <p className="truncate text-sm text-slate-700 dark:text-slate-200">
                          {product.name}
                        </p>
                        <input
                          min="1"
                          max={product.stock}
                          type="number"
                          value={item.quantity}
                          onChange={(event) =>
                            updateSaleItemQuantity(item.productId, event.target.value)
                          }
                          className={inputClass}
                        />
                        <button
                          type="button"
                          onClick={() => removeSaleItem(item.productId)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/15"
                          aria-label={`Remover ${product.name}`}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    );
                  })
                )}
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
                  onClick={() => {
                    setSelectedProductId('');
                    setSelectedQuantity('1');
                    setProductSearchTerm('');
                    setProductSelectionError('');
                    setFormData(EMPTY_FORM);
                    setIsModalOpen(false);
                  }}
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
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
