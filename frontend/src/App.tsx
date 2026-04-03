import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BriefcaseBusiness,
  Clock,
  LayoutDashboard,
  Menu,
  Moon,
  Package,
  Smartphone,
  Sun,
  TrendingUp,
  Wrench,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from './lib/api';
import { cn } from './lib/utils';
import { DashboardView } from './views/DashboardView';
import { InventoryView } from './views/InventoryView';
import { ProfitAnalysisView } from './views/ProfitAnalysisView';
import { ServicesView } from './views/ServicesView';
import { WorkflowView } from './views/WorkflowView';
import {
  Customer,
  DashboardSummary,
  Product,
  ProductFormValues,
  ServiceFormValues,
  ServiceOrder,
  ServiceStatus,
  ThemeMode,
} from './types';

const THEME_STORAGE_KEY = 'theme';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'inventory', label: 'Estoque', icon: Package },
  { id: 'services', label: 'Servicos', icon: Wrench },
  { id: 'workflow', label: 'Fluxo de Trabalho', icon: BriefcaseBusiness },
  { id: 'profit', label: 'Analise de Lucro', icon: TrendingUp },
] as const;

type NavItemId = (typeof navItems)[number]['id'];

const getInitialTheme = (): ThemeMode => {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Nao foi possivel concluir a operacao.';

const normalizePhone = (phone: string) => phone.replace(/\D/g, '');

const parseInteger = (value: string) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseDecimal = (value: string) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<NavItemId>('dashboard');
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<ServiceOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadAppData = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);

    try {
      const [nextProducts, nextServices, nextCustomers, nextDashboardSummary] =
        await Promise.all([
          api.listProducts(),
          api.listServices(),
          api.listCustomers(),
          api.getDashboardSummary(),
        ]);

      setProducts(nextProducts);
      setServices(nextServices);
      setCustomers(nextCustomers);
      setDashboardSummary(nextDashboardSummary);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAppData();
  }, [loadAppData]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const runMutation = useCallback(
    async (action: () => Promise<void>) => {
      setIsMutating(true);
      setErrorMessage(null);

      try {
        await action();
        await loadAppData(false);
      } catch (error) {
        setErrorMessage(getErrorMessage(error));
      } finally {
        setIsMutating(false);
      }
    },
    [loadAppData],
  );

  const handleSaveProduct = useCallback(
    async (values: ProductFormValues, product?: Product | null) => {
      const payload = {
        nome: values.name.trim(),
        marca: values.brand.trim() || undefined,
        modelo_compatavel: values.compatibleModel.trim() || undefined,
        sku: values.sku.trim() || undefined,
        estoque_minimo: parseInteger(values.minStock),
        preco_custo: parseDecimal(values.costPrice),
        preco_venda: parseDecimal(values.salePrice),
      };

      await runMutation(async () => {
        if (product) {
          await api.updateProduct(product.id, {
            ...payload,
            quantidade_estoque: parseInteger(values.stock),
          });
          return;
        }

        await api.createProduct({
          ...payload,
          quantidade_inicial: parseInteger(values.stock),
        });
      });
    },
    [runMutation],
  );

  const handleDeleteProduct = useCallback(
    async (product: Product) => {
      if (!window.confirm(`Deseja desativar o produto "${product.name}"?`)) return;
      await runMutation(async () => {
        await api.deleteProduct(product.id);
      });
    },
    [runMutation],
  );

  const handleCreateService = useCallback(
    async (values: ServiceFormValues) => {
      await runMutation(async () => {
        const phone = normalizePhone(values.customerPhone);
        let customer = customers.find((item) => normalizePhone(item.phone) === phone) ?? null;

        if (!customer) {
          customer = await api.createCustomer({
            nome: values.customerName.trim(),
            telefone: values.customerPhone.trim(),
          });
        }

        const selectedPart = products.find((product) => product.id === values.selectedPartId);
        const partQuantity = Math.max(parseInteger(values.partQuantity), 1);

        if (selectedPart && partQuantity > selectedPart.stock) {
          throw new Error(`Estoque insuficiente para ${selectedPart.name}.`);
        }

        await api.createService({
          cliente_id: customer.id,
          aparelho_marca: values.deviceBrand.trim(),
          aparelho_modelo: values.deviceModel.trim(),
          defeito_relatado: values.issueDescription.trim(),
          termo_responsabilidade_aceito: true,
          valor_mao_de_obra: parseDecimal(values.laborCost),
          itens: selectedPart
            ? [{ produto_id: selectedPart.id, quantidade: partQuantity }]
            : undefined,
        });
      });
    },
    [customers, products, runMutation],
  );

  const handleUpdateServiceStatus = useCallback(
    async (serviceId: string, status: ServiceStatus) => {
      await runMutation(async () => {
        await api.updateServiceStatus(serviceId, status);
      });
    },
    [runMutation],
  );

  const stats = useMemo(() => {
    const deliveredServices = services.filter((service) => service.status === 'delivered');
    const totalRevenue = deliveredServices.reduce((acc, service) => acc + service.totalPrice, 0);
    const totalCosts = deliveredServices.reduce(
      (acc, service) =>
        acc +
        service.partsUsed.reduce(
          (partsAcc, part) => partsAcc + part.costPrice * part.quantity,
          0,
        ),
      0,
    );

    return {
      totalRevenue,
      totalCosts,
      profit: totalRevenue - totalCosts,
      pendingServices: services.filter(
        (service) => service.status !== 'delivered' && service.status !== 'cancelled',
      ).length,
      lowStockItems: products.filter((product) => product.isLowStock).length,
    };
  }, [products, services]);

  const currentLabel = navItems.find((item) => item.id === activeTab)?.label;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <aside
        className={cn(
          'flex flex-col border-r border-slate-200 bg-white transition-all duration-300 dark:border-slate-800 dark:bg-slate-900',
          isSidebarOpen ? 'w-56' : 'w-20',
        )}
      >
        <div className="flex items-center gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
          <div className="rounded-lg bg-blue-600 p-2 text-white">
            <Smartphone size={22} />
          </div>
          {isSidebarOpen && <h1 className="text-lg font-bold tracking-tight">ConsertaSmart</h1>}
        </div>

        <nav className="flex-1 space-y-1.5 p-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all',
                activeTab === item.id
                  ? 'bg-blue-50 font-semibold text-blue-600 shadow-sm dark:bg-blue-500/15 dark:text-blue-300'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
              )}
            >
              <item.icon size={20} />
              {isSidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-3 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setIsSidebarOpen((current) => !current)}
            className="flex w-full items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <Menu size={20} />
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-5 lg:p-6">
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{currentLabel}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Frontend limpo e conectado ao backend principal.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {isMutating && (
              <div className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300">
                Sincronizando alteracoes...
              </div>
            )}
            <button
              type="button"
              onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              <span>{theme === 'light' ? 'Modo escuro' : 'Modo claro'}</span>
            </button>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Clock size={16} className="text-slate-400 dark:text-slate-500" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {format(new Date(), "eeee, d 'de' MMMM", { locale: ptBR })}
              </span>
            </div>
          </div>
        </header>

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            Carregando dados do sistema...
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView stats={stats} services={services} theme={theme} summary={dashboardSummary} />
            )}
            {activeTab === 'inventory' && (
              <InventoryView
                products={products}
                isBusy={isMutating}
                onDeleteProduct={handleDeleteProduct}
                onSaveProduct={handleSaveProduct}
              />
            )}
            {activeTab === 'services' && (
              <ServicesView
                products={products}
                services={services}
                isBusy={isMutating}
                onCreateService={handleCreateService}
                onUpdateServiceStatus={handleUpdateServiceStatus}
              />
            )}
            {activeTab === 'workflow' && (
              <WorkflowView
                services={services}
                isBusy={isMutating}
                onUpdateServiceStatus={handleUpdateServiceStatus}
              />
            )}
            {activeTab === 'profit' && <ProfitAnalysisView services={services} />}
          </>
        )}
      </main>
    </div>
  );
}
