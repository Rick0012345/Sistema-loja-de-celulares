import { Suspense, lazy, useCallback, useMemo, useRef, useState } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { AppMode, AppShell, NavItemId } from './components/AppShell';
import { useAuthSession } from './hooks/useAuthSession';
import { useBackofficeData } from './hooks/useBackofficeData';
import { useThemeMode } from './hooks/useThemeMode';
import { PaymentMethod } from './types';

const PaymentMethodModal = lazy(() =>
  import('./components/PaymentMethodModal').then((module) => ({
    default: module.PaymentMethodModal,
  })),
);
const DashboardView = lazy(() =>
  import('./views/DashboardView').then((module) => ({
    default: module.DashboardView,
  })),
);
const InventoryView = lazy(() =>
  import('./views/InventoryView').then((module) => ({
    default: module.InventoryView,
  })),
);
const ProfitAnalysisView = lazy(() =>
  import('./views/ProfitAnalysisView').then((module) => ({
    default: module.ProfitAnalysisView,
  })),
);
const SalesView = lazy(() =>
  import('./views/SalesView').then((module) => ({
    default: module.SalesView,
  })),
);
const SettingsView = lazy(() =>
  import('./views/SettingsView').then((module) => ({
    default: module.SettingsView,
  })),
);
const ServicesView = lazy(() =>
  import('./views/ServicesView').then((module) => ({
    default: module.ServicesView,
  })),
);
const SuppliersView = lazy(() =>
  import('./views/SuppliersView').then((module) => ({
    default: module.SuppliersView,
  })),
);
const WorkflowView = lazy(() =>
  import('./views/WorkflowView').then((module) => ({
    default: module.WorkflowView,
  })),
);

type PaymentMethodRequestState = {
  title: string;
  description: string;
  amount?: number | null;
  defaultValue?: PaymentMethod;
  confirmLabel?: string;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<NavItemId>('dashboard');
  const [appMode, setAppMode] = useState<AppMode>('repair');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [paymentRequest, setPaymentRequest] = useState<PaymentMethodRequestState | null>(
    null,
  );
  const paymentResolverRef = useRef<((value: PaymentMethod | null) => void) | null>(
    null,
  );
  const { theme, toggleTheme } = useThemeMode();

  const repairTabs: NavItemId[] = [
    'dashboard',
    'inventory',
    'suppliers',
    'services',
    'workflow',
    'settings',
  ];
  const salesTabs: NavItemId[] = ['sales', 'inventory', 'profit', 'settings'];

  const handleSwitchMode = (mode: AppMode) => {
    setAppMode(mode);
    if (mode === 'repair' && !repairTabs.includes(activeTab)) {
      setActiveTab('dashboard');
    }
    if (mode === 'sales' && !salesTabs.includes(activeTab)) {
      setActiveTab('sales');
    }
  };

  const requestPaymentMethod = useCallback(
    (input: PaymentMethodRequestState) =>
      new Promise<PaymentMethod | null>((resolve) => {
        paymentResolverRef.current = resolve;
        setPaymentRequest(input);
      }),
    [],
  );

  const closePaymentMethodModal = useCallback((value: PaymentMethod | null) => {
    paymentResolverRef.current?.(value);
    paymentResolverRef.current = null;
    setPaymentRequest(null);
  }, []);

  const backoffice = useBackofficeData({
    onUnauthorized: async (message) => {
      setAppMode('repair');
      setActiveTab('dashboard');
      await auth.logout(message);
    },
  });

  const auth = useAuthSession({
    onAuthenticated: async () => {
      await backoffice.loadAppData();
    },
    onResetData: () => {
      setAppMode('repair');
      setActiveTab('dashboard');
      backoffice.resetData();
    },
  });

  const errorMessage = auth.errorMessage ?? backoffice.errorMessage;
  const repairInventoryProducts = backoffice.products.filter(
    (product) => product.inventoryType !== 'sales',
  );
  const repairProducts = backoffice.products.filter(
    (product) => product.inventoryType === 'repair',
  );
  const salesProducts = backoffice.products.filter(
    (product) => product.inventoryType === 'sales',
  );
  const contentFallback = (
    <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
      Carregando modulo...
    </div>
  );

  const activeView = useMemo(() => {
    if (appMode === 'repair' && activeTab === 'dashboard') {
      return (
        <DashboardView
          stats={backoffice.stats}
          services={backoffice.services}
          theme={theme}
          summary={backoffice.dashboardSummary}
          professionalOperation={backoffice.professionalOperation}
        />
      );
    }

    if (activeTab === 'inventory') {
      return (
        <InventoryView
          appMode={appMode}
          products={appMode === 'repair' ? repairInventoryProducts : salesProducts}
          suppliers={backoffice.suppliers}
          isBusy={backoffice.isMutating}
          onDeleteProduct={backoffice.deleteProduct}
          onSaveProduct={backoffice.saveProduct}
        />
      );
    }

    if (appMode === 'repair' && activeTab === 'suppliers') {
      return (
        <SuppliersView
          suppliers={backoffice.suppliers}
          isBusy={backoffice.isMutating}
          onDeleteSupplier={backoffice.deleteSupplier}
          onSaveSupplier={backoffice.saveSupplier}
        />
      );
    }

    if (appMode === 'sales' && activeTab === 'sales') {
      return (
        <SalesView
          products={salesProducts}
          sales={backoffice.sales}
          isBusy={backoffice.isMutating}
          onCreateSale={backoffice.createSale}
        />
      );
    }

    if (appMode === 'repair' && activeTab === 'services') {
      return (
        <ServicesView
          products={repairProducts}
          services={backoffice.services}
          isBusy={backoffice.isMutating}
          onCreateService={backoffice.createService}
          onUpdateService={backoffice.updateService}
          onUpdateServiceStatus={backoffice.updateServiceStatus}
          onRequestPaymentMethod={requestPaymentMethod}
        />
      );
    }

    if (appMode === 'repair' && activeTab === 'workflow') {
      return (
        <WorkflowView
          services={backoffice.services}
          summary={backoffice.dashboardSummary}
          isBusy={backoffice.isMutating}
          onLoadServiceDetails={backoffice.getServiceDetails}
          onUpdateServiceStatus={backoffice.updateServiceStatus}
          onRequestPaymentMethod={requestPaymentMethod}
          onRetryWebhook={backoffice.retryWebhook}
        />
      );
    }

    if (appMode === 'sales' && activeTab === 'profit') {
      return (
        <ProfitAnalysisView
          report={backoffice.financialReport}
          onRefreshReport={backoffice.refreshFinancialReport}
        />
      );
    }

    if (activeTab === 'settings') {
      return <SettingsView currentUser={auth.session} />;
    }

    return null;
  }, [
    activeTab,
    appMode,
    auth.session,
    backoffice.createSale,
    backoffice.createService,
    backoffice.dashboardSummary,
    backoffice.deleteProduct,
    backoffice.deleteSupplier,
    backoffice.financialReport,
    backoffice.getServiceDetails,
    backoffice.isMutating,
    backoffice.products,
    backoffice.professionalOperation,
    backoffice.refreshFinancialReport,
    backoffice.retryWebhook,
    backoffice.sales,
    backoffice.saveProduct,
    backoffice.saveSupplier,
    backoffice.services,
    backoffice.stats,
    backoffice.suppliers,
    backoffice.updateService,
    backoffice.updateServiceStatus,
    repairInventoryProducts,
    repairProducts,
    requestPaymentMethod,
    salesProducts,
    theme,
  ]);

  if (auth.isCheckingAuth) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-100 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-5 text-sm font-semibold dark:border-slate-800 dark:bg-slate-900">
          Carregando ambiente...
        </div>
      </div>
    );
  }

  if (!auth.session) {
    return (
      <AuthScreen
        errorMessage={errorMessage}
        isBusy={auth.isAuthenticating}
        theme={theme}
        onLogin={auth.login}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <AppShell
      activeTab={activeTab}
      appMode={appMode}
      currentUserName={auth.session.nome}
      errorMessage={errorMessage}
      isMutating={backoffice.isMutating}
      isSidebarOpen={isSidebarOpen}
      notifications={backoffice.notifications}
      onLogout={auth.logout}
      onMarkAllNotificationsAsRead={backoffice.markAllNotificationsAsRead}
      onMarkNotificationAsRead={backoffice.markNotificationAsRead}
      onSelectTab={setActiveTab}
      onSwitchMode={handleSwitchMode}
      onToggleSidebar={() => setIsSidebarOpen((current) => !current)}
      onToggleTheme={toggleTheme}
      theme={theme}
    >
      {backoffice.isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Carregando dados do sistema...
        </div>
      ) : (
        <Suspense fallback={contentFallback}>{activeView}</Suspense>
      )}
      <Suspense fallback={null}>
        <PaymentMethodModal
          isOpen={Boolean(paymentRequest)}
          title={paymentRequest?.title ?? 'Registrar pagamento'}
          description={paymentRequest?.description ?? 'Selecione a forma de pagamento.'}
          amount={paymentRequest?.amount}
          defaultValue={paymentRequest?.defaultValue}
          confirmLabel={paymentRequest?.confirmLabel}
          isBusy={backoffice.isMutating}
          onClose={() => closePaymentMethodModal(null)}
          onConfirm={(value) => closePaymentMethodModal(value)}
        />
      </Suspense>
    </AppShell>
  );
}
