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
  Settings,
  ShoppingCart,
  Smartphone,
  Store,
  Sun,
  TrendingUp,
  Truck,
  Wrench,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { NotificationItem, ThemeMode } from '../types';

const repairNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'inventory', label: 'Estoque de manutencao', icon: Package },
  { id: 'suppliers', label: 'Fornecedores', icon: Truck },
  { id: 'services', label: 'Ordens de servico', icon: Wrench },
  { id: 'workflow', label: 'Fluxo de trabalho', icon: BriefcaseBusiness },
  { id: 'settings', label: 'Configuracoes', icon: Settings },
] as const;

const salesNavItems = [
  { id: 'sales', label: 'Registrar vendas', icon: ShoppingCart },
  { id: 'inventory', label: 'Produtos para venda', icon: Store },
  { id: 'profit', label: 'Analise de vendas', icon: TrendingUp },
  { id: 'settings', label: 'Configuracoes', icon: Settings },
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

const surfaceClass =
  'border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900';

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
  const currentLabel = navItems.find((item) => item.id === activeTab)?.label ?? 'Painel';
  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  );
  const currentModeLabel =
    appMode === 'repair' ? 'Assistencia tecnica' : 'Operacao de vendas';
  const sidebarWidthClass = isSidebarOpen ? 'lg:w-64' : 'lg:w-auto';

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
            className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={onToggleSidebar}
          />
        )}
      </AnimatePresence>

      <div className="mx-auto flex min-h-dvh max-w-[1600px]">
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 flex w-[84vw] max-w-[296px] flex-col border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-950 lg:sticky lg:top-0 lg:h-dvh lg:max-w-none lg:translate-x-0',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
            sidebarWidthClass,
          )}
        >
          <div className="border-b border-slate-200 px-4 py-4 dark:border-slate-800">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950">
                  <Smartphone size={18} />
                </div>
                {isSidebarOpen && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">
                      Sistema
                    </p>
                    <h1 className="text-base font-bold text-slate-950 dark:text-white">
                      ConsertaSmart
                    </h1>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={onToggleSidebar}
                aria-label={isSidebarOpen ? 'Recolher menu' : 'Expandir menu'}
                className="hidden size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100 lg:inline-flex"
              >
                <Menu size={16} />
              </button>
            </div>

            {isSidebarOpen && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">
                  Ambiente atual
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                  {currentModeLabel}
                </p>
              </div>
            )}
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                  activeTab === item.id
                    ? 'border-slate-300 bg-slate-100 text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                    : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-400 dark:hover:border-slate-800 dark:hover:bg-slate-900 dark:hover:text-slate-100',
                )}
              >
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-md',
                    activeTab === item.id
                      ? 'bg-white text-slate-900 dark:bg-slate-950 dark:text-white'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400',
                  )}
                >
                  <item.icon size={16} />
                </span>
                {isSidebarOpen && <span className="truncate font-medium">{item.label}</span>}
              </button>
            ))}
          </nav>

          <div className="border-t border-slate-200 p-3 dark:border-slate-800">
            <div
              className={cn(
                'rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-800 dark:bg-slate-900',
                !isSidebarOpen && 'flex justify-center px-2',
              )}
            >
              {isSidebarOpen ? (
                <>
                  <p className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">
                    Usuario
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-950 dark:text-white">
                    {currentUserName}
                  </p>
                </>
              ) : (
                <div className="flex size-8 items-center justify-center rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950">
                  <Smartphone size={14} />
                </div>
              )}
            </div>
          </div>
        </aside>

        <main className="flex-1 px-4 py-4 lg:px-6 lg:py-5">
          <div className="flex flex-col gap-4">
            <header className={cn('sticky top-4 z-20 rounded-xl px-4 py-4 lg:px-5', surfaceClass)}>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={onToggleSidebar}
                    aria-label="Abrir menu lateral"
                    className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 lg:hidden"
                  >
                    <Menu size={16} />
                  </button>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {currentModeLabel}
                      </span>
                      {isMutating && (
                        <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                          Salvando
                        </span>
                      )}
                    </div>
                    <h2 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
                      {currentLabel}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Painel operacional com leitura rapida, foco em controle e acoes frequentes.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:flex-wrap xl:justify-end">
                  <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950">
                    <button
                      type="button"
                      onClick={() => onSwitchMode('repair')}
                      className={cn(
                        'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        appMode === 'repair'
                          ? 'bg-white text-slate-950 dark:bg-slate-900 dark:text-white'
                          : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white',
                      )}
                    >
                      Conserto
                    </button>
                    <button
                      type="button"
                      onClick={() => onSwitchMode('sales')}
                      className={cn(
                        'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        appMode === 'sales'
                          ? 'bg-white text-slate-950 dark:bg-slate-900 dark:text-white'
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
                      className="relative flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-950"
                    >
                      <Bell size={15} />
                      <span>Notificacoes</span>
                      {unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 rounded-full bg-rose-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
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
                          transition={{ duration: 0.18, ease: 'easeOut' }}
                          className="absolute right-0 z-30 mt-2 w-[min(92vw,360px)] rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-800 dark:bg-slate-950"
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              Central de notificacoes
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
                                Nenhuma notificacao no momento.
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
                    className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-950"
                  >
                    {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
                    <span>{theme === 'light' ? 'Modo escuro' : 'Modo claro'}</span>
                  </button>

                  <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                    <Clock3 size={15} className="text-slate-400 dark:text-slate-500" />
                    <span>{format(new Date(), "eeee, d 'de' MMMM", { locale: ptBR })}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => void onLogout()}
                    className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-950"
                  >
                    <LogOut size={15} />
                    <span>Sair</span>
                  </button>
                </div>
              </div>
            </header>

            {errorMessage && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                {errorMessage}
              </div>
            )}

            <div>{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
};
