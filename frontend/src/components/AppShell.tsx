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
  'border border-slate-200/80 bg-white/88 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.45)] backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/82';

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
    appMode === 'repair' ? 'Assistencia tecnica' : 'Frente de vendas';
  const sidebarWidthClass = isSidebarOpen ? 'lg:w-72' : 'lg:w-24';

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
    <div className="relative min-h-dvh overflow-hidden bg-slate-100 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-40">
        <div className="absolute left-[-8rem] top-[-10rem] h-64 w-64 rounded-full border border-blue-200/70 dark:border-blue-500/10" />
        <div className="absolute right-[-6rem] top-24 h-52 w-52 rounded-full border border-slate-300/80 dark:border-slate-700/70" />
        <div className="absolute bottom-[-8rem] left-1/3 h-72 w-72 rounded-full border border-emerald-200/70 dark:border-emerald-500/10" />
      </div>

      <AnimatePresence>
        {isSidebarOpen && (
          <motion.button
            type="button"
            aria-label="Fechar menu lateral"
            className="fixed inset-0 z-30 bg-slate-950/45 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={onToggleSidebar}
          />
        )}
      </AnimatePresence>

      <div className="relative flex min-h-dvh">
        <motion.aside
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className={cn(
            'fixed inset-y-0 left-0 z-40 flex w-[86vw] max-w-[320px] flex-col overflow-hidden border-r border-slate-200/80 bg-white/92 backdrop-blur-xl transition-transform dark:border-slate-800/80 dark:bg-slate-950/92 lg:sticky lg:top-0 lg:h-dvh lg:max-w-none lg:translate-x-0',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
            sidebarWidthClass,
          )}
        >
          <div className="border-b border-slate-200/70 px-4 py-5 dark:border-slate-800/80">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                  <Smartphone size={22} />
                </div>
                {isSidebarOpen && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                      Operacao
                    </p>
                    <h1 className="text-lg font-extrabold text-slate-950 dark:text-white">
                      ConsertaSmart
                    </h1>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={onToggleSidebar}
                aria-label={isSidebarOpen ? 'Recolher menu' : 'Expandir menu'}
                className="inline-flex size-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
              >
                {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>

            {isSidebarOpen && (
              <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-semibold uppercase text-blue-600 dark:text-blue-300">
                  Ambiente ativo
                </p>
                <p className="mt-2 text-base font-bold text-slate-950 dark:text-white">
                  {currentModeLabel}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Acesso rapido ao fluxo principal da equipe.
                </p>
              </div>
            )}
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
            {navItems.map((item, index) => (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16, ease: 'easeOut', delay: index * 0.02 }}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm transition-all',
                  activeTab === item.id
                    ? 'border border-blue-200 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-500/20 dark:bg-blue-500/15 dark:text-blue-200'
                    : 'border border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-400 dark:hover:border-slate-800 dark:hover:bg-slate-900 dark:hover:text-slate-100',
                )}
              >
                <span
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-2xl',
                    activeTab === item.id
                      ? 'bg-white text-blue-600 dark:bg-slate-950 dark:text-blue-300'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-slate-950 dark:group-hover:text-slate-100',
                  )}
                >
                  <item.icon size={18} />
                </span>
                {isSidebarOpen && (
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{item.label}</p>
                    <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                      {activeTab === item.id ? 'Tela atual' : 'Acessar modulo'}
                    </p>
                  </div>
                )}
              </motion.button>
            ))}
          </nav>

          <div className="border-t border-slate-200/70 p-3 dark:border-slate-800/80">
            <div
              className={cn(
                'rounded-3xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900',
                !isSidebarOpen && 'flex justify-center px-2 py-3',
              )}
            >
              {isSidebarOpen ? (
                <>
                  <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                    Usuario ativo
                  </p>
                  <p className="mt-1 truncate font-bold text-slate-950 dark:text-white">
                    {currentUserName}
                  </p>
                </>
              ) : (
                <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                  <Smartphone size={18} />
                </div>
              )}
            </div>
          </div>
        </motion.aside>

        <main className="relative flex-1 px-4 py-4 lg:px-6 lg:py-6">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
            <header className={cn('sticky top-4 z-20 rounded-[28px] p-4 lg:p-5', surfaceClass)}>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={onToggleSidebar}
                    aria-label="Abrir menu lateral"
                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
                  >
                    <Menu size={18} />
                  </button>
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                        {currentModeLabel}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {currentLabel}
                      </span>
                      {isMutating && (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                          Sincronizando alteracoes
                        </span>
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-extrabold text-slate-950 dark:text-white lg:text-3xl">
                        {currentLabel}
                      </h2>
                      <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                        Painel pensado para agilizar a rotina, reduzir cliques e manter a equipe orientada.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:flex xl:flex-wrap xl:justify-end">
                  <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-950">
                    <button
                      type="button"
                      onClick={() => onSwitchMode('repair')}
                      className={cn(
                        'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                        appMode === 'repair'
                          ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-900 dark:text-white'
                          : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white',
                      )}
                    >
                      Conserto
                    </button>
                    <button
                      type="button"
                      onClick={() => onSwitchMode('sales')}
                      className={cn(
                        'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                        appMode === 'sales'
                          ? 'bg-blue-600 text-white shadow-sm'
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
                      className="relative flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-950"
                    >
                      <Bell size={16} />
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
                          className="absolute right-0 z-30 mt-2 w-[min(92vw,380px)] rounded-[28px] border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              Central de notificacoes
                            </p>
                            <button
                              type="button"
                              onClick={() => void onMarkAllNotificationsAsRead()}
                              className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-500/10"
                            >
                              <CheckCheck size={14} />
                              Marcar todas
                            </button>
                          </div>
                          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                            {notifications.length === 0 && (
                              <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
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
                                  'w-full rounded-2xl border p-3 text-left transition-all',
                                  getNotificationStyle(notification.severity),
                                  notification.isRead
                                    ? 'opacity-75'
                                    : 'ring-1 ring-blue-200 dark:ring-blue-500/20',
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
                    className="flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-950"
                  >
                    {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                    <span>{theme === 'light' ? 'Modo escuro' : 'Modo claro'}</span>
                  </button>

                  <div className="flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                    <Clock3 size={16} className="text-slate-400 dark:text-slate-500" />
                    <span>{format(new Date(), "eeee, d 'de' MMMM", { locale: ptBR })}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => void onLogout()}
                    className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-950"
                  >
                    <LogOut size={16} />
                    <span>Sair</span>
                  </button>
                </div>
              </div>
            </header>

            {errorMessage && (
              <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
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
