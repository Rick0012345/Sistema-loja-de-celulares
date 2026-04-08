import { useCallback, useRef, useState } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { AppMode, AppShell, NavItemId } from './components/AppShell';
import { PaymentMethodModal } from './components/PaymentMethodModal';
import { DashboardView } from './views/DashboardView';
import { InventoryView } from './views/InventoryView';
import { ProfitAnalysisView } from './views/ProfitAnalysisView';
import { SalesView } from './views/SalesView';
import { SettingsView } from './views/SettingsView';
import { ServicesView } from './views/ServicesView';
import { WorkflowView } from './views/WorkflowView';
import { useAuthSession } from './hooks/useAuthSession';
import { useBackofficeData } from './hooks/useBackofficeData';
import { useThemeMode } from './hooks/useThemeMode';
import { PaymentMethod } from './types';

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

  const repairTabs: NavItemId[] = ['dashboard', 'inventory', 'services', 'workflow', 'settings'];
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

  if (auth.isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
        Carregando...
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
      onLogout={auth.logout}
      onSelectTab={setActiveTab}
      onSwitchMode={handleSwitchMode}
      onToggleSidebar={() => setIsSidebarOpen((current) => !current)}
      onToggleTheme={toggleTheme}
      theme={theme}
    >
      {backoffice.isLoading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Carregando dados do sistema...
        </div>
      ) : (
        <>
          {appMode === 'repair' && activeTab === 'dashboard' && (
            <DashboardView
              stats={backoffice.stats}
              services={backoffice.services}
              theme={theme}
              summary={backoffice.dashboardSummary}
            />
          )}
          {activeTab === 'inventory' && (
            <InventoryView
              products={backoffice.products}
              isBusy={backoffice.isMutating}
              onDeleteProduct={backoffice.deleteProduct}
              onSaveProduct={backoffice.saveProduct}
            />
          )}
          {appMode === 'sales' && activeTab === 'sales' && (
            <SalesView
              products={backoffice.products}
              sales={backoffice.sales}
              isBusy={backoffice.isMutating}
              onCreateSale={backoffice.createSale}
            />
          )}
          {appMode === 'repair' && activeTab === 'services' && (
            <ServicesView
              products={backoffice.products}
              services={backoffice.services}
              isBusy={backoffice.isMutating}
              onCreateService={backoffice.createService}
              onUpdateService={backoffice.updateService}
              onUpdateServiceStatus={backoffice.updateServiceStatus}
              onRequestPaymentMethod={requestPaymentMethod}
            />
          )}
          {appMode === 'repair' && activeTab === 'workflow' && (
            <WorkflowView
              services={backoffice.services}
              isBusy={backoffice.isMutating}
              onUpdateServiceStatus={backoffice.updateServiceStatus}
              onRequestPaymentMethod={requestPaymentMethod}
            />
          )}
          {appMode === 'sales' && activeTab === 'profit' && (
            <ProfitAnalysisView services={backoffice.services} />
          )}
          {activeTab === 'settings' && <SettingsView currentUser={auth.session} />}
        </>
      )}
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
    </AppShell>
  );
}
