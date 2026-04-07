import { useState } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { AppShell, NavItemId } from './components/AppShell';
import { DashboardView } from './views/DashboardView';
import { InventoryView } from './views/InventoryView';
import { ProfitAnalysisView } from './views/ProfitAnalysisView';
import { ServicesView } from './views/ServicesView';
import { WorkflowView } from './views/WorkflowView';
import { useAuthSession } from './hooks/useAuthSession';
import { useBackofficeData } from './hooks/useBackofficeData';
import { useThemeMode } from './hooks/useThemeMode';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavItemId>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { theme, toggleTheme } = useThemeMode();

  const backoffice = useBackofficeData({
    onUnauthorized: async (message) => {
      setActiveTab('dashboard');
      await auth.logout(message);
    },
  });

  const auth = useAuthSession({
    onAuthenticated: async () => {
      await backoffice.loadAppData();
    },
    onResetData: () => {
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
      currentUserName={auth.session.nome}
      errorMessage={errorMessage}
      isMutating={backoffice.isMutating}
      isSidebarOpen={isSidebarOpen}
      onLogout={auth.logout}
      onSelectTab={setActiveTab}
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
          {activeTab === 'dashboard' && (
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
          {activeTab === 'services' && (
            <ServicesView
              products={backoffice.products}
              services={backoffice.services}
              isBusy={backoffice.isMutating}
              onCreateService={backoffice.createService}
              onUpdateServiceStatus={backoffice.updateServiceStatus}
            />
          )}
          {activeTab === 'workflow' && (
            <WorkflowView
              services={backoffice.services}
              isBusy={backoffice.isMutating}
              onUpdateServiceStatus={backoffice.updateServiceStatus}
            />
          )}
          {activeTab === 'profit' && (
            <ProfitAnalysisView services={backoffice.services} />
          )}
        </>
      )}
    </AppShell>
  );
}
