import { ReactNode, useMemo, useState } from 'react';
import {
  Bell,
  BriefcaseBusiness,
  CheckCheck,
  Clock3,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShoppingCart,
  Smartphone,
  Store,
  Sun,
  TrendingUp,
  Truck,
  Wrench,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { NotificationItem, ThemeMode } from '../types';

const repairNavItems = [
  { id: 'dashboard', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'services', label: 'Ordens de serviço', icon: Wrench },
  { id: 'workflow', label: 'Fluxo operacional', icon: BriefcaseBusiness },
  { id: 'inventory', label: 'Peças e estoque', icon: Package },
  { id: 'suppliers', label: 'Fornecedores', icon: Truck },
  { id: 'settings', label: 'Configurações', icon: Settings },
] as const;

const salesNavItems = [
  { id: 'sales', label: 'Caixa e vendas', icon: ShoppingCart },
  { id: 'inventory', label: 'Produtos', icon: Store },
  { id: 'profit', label: 'Margem e análise', icon: TrendingUp },
  { id: 'settings', label: 'Configurações', icon: Settings },
] as const;

export type AppMode = 'repair' | 'sales';
export type NavItemId =
  | 'dashboard'
  | 'inventory'
  | 'suppliers'
  | 'services'
  | 'workflow'
  | 'profit'
  | 'sales'
  | 'settings';

type AppShellProps = {
  activeTab: NavItemId;
  appMode: AppMode;
  children: ReactNode;
  currentUserName: string;
  errorMessage: string | null;
  isMutating: boolean;
  isSidebarOpen: boolean;
  notifications: NotificationItem[];
  onLogout: () => void | Promise<void>;
  onMarkAllNotificationsAsRead: () => void | Promise<void>;
  onMarkNotificationAsRead: (id: string) => void | Promise<void>;
  onSelectTab: (tab: NavItemId) => void;
  onSwitchMode: (mode: AppMode) => void;
  onToggleSidebar: () => void;
  onToggleTheme: () => void;
  theme: ThemeMode;
};

const modeCopy = {
  repair: {
    label: 'Assistência técnica',
    shortLabel: 'Oficina',
    description: 'OS, peças, técnicos e entregas',
  },
  sales: {
    label: 'Operação de vendas',
    shortLabel: 'Vendas',
    description: 'Caixa, produtos e margem',
  },
} as const;

export const AppShell = ({
  activeTab,
  appMode,
  children,
  currentUserName,
  errorMessage,
  isMutating,
  isSidebarOpen,
  notifications,
  onLogout,
  onMarkAllNotificationsAsRead,
  onMarkNotificationAsRead,
  onSelectTab,
  onSwitchMode,
  onToggleSidebar,
  onToggleTheme,
  theme,
}: AppShellProps) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const navItems = appMode === 'repair' ? repairNavItems : salesNavItems;
  const currentItem = navItems.find((item) => item.id === activeTab);
  const currentLabel = currentItem?.label ?? 'Painel';
  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  );
  const currentMode = modeCopy[appMode];
  const sidebarWidthClass = isSidebarOpen ? 'lg:w-72' : 'lg:w-[5.25rem]';

  const getNotificationStyle = (severity: NotificationItem['severity']) => {
    const styles = {
      info: 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200',
      warning:
        'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200',
      critical:
        'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-200',
      success:
        'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200',
    } as const;

    return styles[severity];
  };

  const handleSelectTab = (tab: NavItemId) => {
    onSelectTab(tab);
    if (window.innerWidth < 1024 && isSidebarOpen) {
      onToggleSidebar();
    }
  };

  return (
    <div className="min-h-dvh bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.button
            type="button"
            aria-label="Fechar menu lateral"
            className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            onClick={onToggleSidebar}
          />
        )}
      </AnimatePresence>

      <div className="flex min-h-dvh">
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 flex w-[86vw] max-w-[312px] flex-col bg-slate-950 text-slate-100 shadow-xl transition-all lg:sticky lg:top-0 lg:h-dvh lg:max-w-none lg:translate-x-0 lg:shadow-none',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
            sidebarWidthClass,
          )}
        >
          <div className="border-b border-slate-800 px-4 py-4">
            <div
              className={cn(
                'flex items-center justify-between gap-3',
                !isSidebarOpen && 'flex-col justify-center gap-2',
              )}
            >
              <div
                className={cn(
                  'flex min-w-0 items-center gap-3',
                  !isSidebarOpen && 'justify-center',
                )}
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-slate-950">
                  <Smartphone size={18} />
                </div>
                {isSidebarOpen && (
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Gestão de loja
                    </p>
                    <h1 className="truncate text-base font-semibold text-white">
                      ConsertaSmart
                    </h1>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={onToggleSidebar}
                aria-label={isSidebarOpen ? 'Recolher menu' : 'Expandir menu'}
                className="hidden size-9 shrink-0 items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition-colors hover:bg-slate-900 hover:text-white lg:inline-flex"
              >
                {isSidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
              </button>
            </div>

            {isSidebarOpen && (
              <div className="mt-5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-3">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Módulo ativo
                </p>
                <p className="mt-1 text-sm font-semibold text-white">{currentMode.label}</p>
                <p className="mt-1 text-xs text-slate-400">{currentMode.description}</p>
              </div>
            )}
          </div>

          <div className="px-3 py-4">
            {isSidebarOpen && (
              <p className="mb-2 px-3 text-xs font-semibold uppercase text-slate-500">
                Navegação
              </p>
            )}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectTab(item.id)}
                    title={!isSidebarOpen ? item.label : undefined}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                      isActive
                        ? 'bg-white text-slate-950'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-white',
                      !isSidebarOpen && 'justify-center px-2',
                    )}
                  >
                    <item.icon size={17} className="shrink-0" />
                    {isSidebarOpen && <span className="truncate font-medium">{item.label}</span>}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto border-t border-slate-800 p-3">
            <div
              className={cn(
                'rounded-lg border border-slate-800 bg-slate-900 px-3 py-3',
                !isSidebarOpen && 'flex justify-center px-2',
              )}
            >
              {isSidebarOpen ? (
                <>
                  <p className="text-xs font-semibold uppercase text-slate-500">Usuário</p>
                  <p className="mt-1 truncate text-sm font-semibold text-white">
                    {currentUserName}
                  </p>
                </>
              ) : (
                <div className="flex size-8 items-center justify-center rounded-md bg-white text-slate-950">
                  <Smartphone size={14} />
                </div>
              )}
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
            <div className="flex min-h-16 flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={onToggleSidebar}
                  aria-label="Abrir menu lateral"
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 lg:hidden"
                >
                  <Menu size={16} />
                </button>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                      {currentMode.shortLabel}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-600">/</span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {currentLabel}
                    </span>
                    {isMutating && (
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                        Salvando
                      </span>
                    )}
                  </div>
                  <h2 className="mt-1 truncate text-xl font-semibold text-slate-950 dark:text-white">
                    {currentLabel}
                  </h2>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900">
                  <button
                    type="button"
                    onClick={() => onSwitchMode('repair')}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-sm font-semibold transition-colors',
                      appMode === 'repair'
                        ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white'
                        : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white',
                    )}
                  >
                    Oficina
                  </button>
                  <button
                    type="button"
                    onClick={() => onSwitchMode('sales')}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-sm font-semibold transition-colors',
                      appMode === 'sales'
                        ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white'
                        : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white',
                    )}
                  >
                    Vendas
                  </button>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsNotificationsOpen((current) => !current)}
                    aria-label="Abrir notificações"
                    className="relative inline-flex size-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Bell size={16} />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 rounded-full bg-rose-600 px-1.5 py-0.5 text-xs font-semibold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {isNotificationsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.16, ease: 'easeOut' }}
                        className="absolute right-0 z-30 mt-2 w-[min(92vw,380px)] rounded-lg border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-800 dark:bg-slate-950"
                      >
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            Notificações
                          </p>
                          <button
                            type="button"
                            onClick={() => void onMarkAllNotificationsAsRead()}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
                          >
                            <CheckCheck size={13} />
                            Marcar todas
                          </button>
                        </div>
                        <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                          {notifications.length === 0 && (
                            <div className="rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                              Nenhuma notificação no momento.
                            </div>
                          )}
                          {notifications.map((notification) => (
                            <button
                              key={notification.id}
                              type="button"
                              onClick={() => {
                                if (!notification.isRead) {
                                  void onMarkNotificationAsRead(notification.id);
                                }
                              }}
                              className={cn(
                                'w-full rounded-lg border p-3 text-left transition-colors',
                                getNotificationStyle(notification.severity),
                                notification.isRead
                                  ? 'opacity-75'
                                  : 'ring-1 ring-slate-200 dark:ring-slate-700',
                              )}
                            >
                              <div className="mb-1 flex items-start justify-between gap-3">
                                <p className="text-sm font-semibold">{notification.title}</p>
                                <span className="whitespace-nowrap text-xs opacity-70">
                                  {formatDistanceToNow(new Date(notification.createdAt), {
                                    addSuffix: true,
                                    locale: ptBR,
                                  })}
                                </span>
                              </div>
                              <p className="text-xs leading-relaxed opacity-90">
                                {notification.message}
                              </p>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  type="button"
                  onClick={onToggleTheme}
                  aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
                  className="inline-flex size-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                </button>

                <div className="hidden h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 xl:flex">
                  <Clock3 size={15} className="text-slate-400 dark:text-slate-500" />
                  <span>{format(new Date(), "eeee, d 'de' MMMM", { locale: ptBR })}</span>
                </div>

                <button
                  type="button"
                  onClick={() => void onLogout()}
                  aria-label="Sair"
                  className="inline-flex size-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </header>

          <div className="px-4 py-5 lg:px-6">
            {errorMessage && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                {errorMessage}
              </div>
            )}

            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
