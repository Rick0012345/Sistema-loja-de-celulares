import { ReactNode } from 'react';
import {
  BriefcaseBusiness,
  Clock,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  Smartphone,
  Store,
  Sun,
  TrendingUp,
  Wrench,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { ThemeMode } from '../types';

const repairNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'inventory', label: 'Estoque de Manutenção', icon: Package },
  { id: 'services', label: 'Ordens de Serviço', icon: Wrench },
  { id: 'workflow', label: 'Fluxo de Trabalho', icon: BriefcaseBusiness },
] as const;

const salesNavItems = [
  { id: 'inventory', label: 'Produtos para Venda', icon: Store },
  { id: 'profit', label: 'Análise de Vendas', icon: TrendingUp },
] as const;

export type AppMode = 'repair' | 'sales';
export type NavItemId = 'dashboard' | 'inventory' | 'services' | 'workflow' | 'profit';

type AppShellProps = {
  activeTab: NavItemId;
  appMode: AppMode;
  children: ReactNode;
  currentUserName: string;
  errorMessage: string | null;
  isMutating: boolean;
  isSidebarOpen: boolean;
  onLogout: () => void | Promise<void>;
  onSelectTab: (tab: NavItemId) => void;
  onSwitchMode: (mode: AppMode) => void;
  onToggleSidebar: () => void;
  onToggleTheme: () => void;
  theme: ThemeMode;
};

export const AppShell = ({
  activeTab,
  appMode,
  children,
  currentUserName,
  errorMessage,
  isMutating,
  isSidebarOpen,
  onLogout,
  onSelectTab,
  onSwitchMode,
  onToggleSidebar,
  onToggleTheme,
  theme,
}: AppShellProps) => {
  const navItems = appMode === 'repair' ? repairNavItems : salesNavItems;
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
              onClick={() => onSelectTab(item.id)}
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
            onClick={onToggleSidebar}
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
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{currentUserName}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => onSwitchMode('repair')}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                  appMode === 'repair'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                )}
              >
                Conserto
              </button>
              <button
                type="button"
                onClick={() => onSwitchMode('sales')}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                  appMode === 'sales'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                )}
              >
                Vendas
              </button>
            </div>
            {isMutating && (
              <div className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300">
                Salvando...
              </div>
            )}
            <button
              type="button"
              onClick={onToggleTheme}
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
            <button
              type="button"
              onClick={() => void onLogout()}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <LogOut size={16} />
              <span>Sair</span>
            </button>
          </div>
        </header>

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
            {errorMessage}
          </div>
        )}

        {children}
      </main>
    </div>
  );
};
