import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  PackageCheck,
  Wrench,
} from 'lucide-react';
import { ServiceStatus } from '../types';

export const serviceStatusLabel: Record<ServiceStatus, string> = {
  aguardando_orcamento: 'Aguardando orcamento',
  aguardando_aprovacao: 'Aguardando aprovacao',
  aguardando_peca: 'Aguardando peca',
  em_conserto: 'Em conserto',
  pronto_para_retirada: 'Pronto para retirada',
  entregue: 'Entregue',
  cancelada: 'Cancelada',
};

export const serviceStatusBadgeClass: Record<ServiceStatus, string> = {
  aguardando_orcamento:
    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  aguardando_aprovacao:
    'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  aguardando_peca:
    'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
  em_conserto:
    'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  pronto_para_retirada:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  entregue:
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  cancelada:
    'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
};

export const serviceStatusPanelClass: Record<ServiceStatus, string> = {
  aguardando_orcamento:
    'border-slate-200 bg-white/85 dark:border-slate-800 dark:bg-slate-900/85',
  aguardando_aprovacao:
    'border-amber-200 bg-amber-50/70 dark:border-amber-500/30 dark:bg-amber-500/10',
  aguardando_peca:
    'border-orange-200 bg-orange-50/70 dark:border-orange-500/30 dark:bg-orange-500/10',
  em_conserto:
    'border-blue-200 bg-blue-50/70 dark:border-blue-500/30 dark:bg-blue-500/10',
  pronto_para_retirada:
    'border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/30 dark:bg-emerald-500/10',
  entregue:
    'border-indigo-200 bg-indigo-50/70 dark:border-indigo-500/30 dark:bg-indigo-500/10',
  cancelada:
    'border-rose-200 bg-rose-50/70 dark:border-rose-500/30 dark:bg-rose-500/10',
};

export const serviceStatusOptions: Array<{
  id: ServiceStatus;
  title: string;
  icon: typeof Clock3;
}> = [
  {
    id: 'aguardando_orcamento',
    title: 'Aguardando orcamento',
    icon: Clock3,
  },
  {
    id: 'aguardando_aprovacao',
    title: 'Aguardando aprovacao',
    icon: AlertTriangle,
  },
  {
    id: 'aguardando_peca',
    title: 'Aguardando peca',
    icon: PackageCheck,
  },
  {
    id: 'em_conserto',
    title: 'Em conserto',
    icon: Wrench,
  },
  {
    id: 'pronto_para_retirada',
    title: 'Pronto para retirada',
    icon: CheckCircle2,
  },
  {
    id: 'entregue',
    title: 'Entregue',
    icon: CheckCircle2,
  },
  {
    id: 'cancelada',
    title: 'Cancelada',
    icon: AlertTriangle,
  },
];

export const workflowColumns: Array<{
  id: ServiceStatus;
  title: string;
  icon: typeof Clock3;
}> = serviceStatusOptions;

export const isOpenServiceStatus = (status: ServiceStatus) =>
  status !== 'entregue' && status !== 'cancelada';

export const getNextServiceAction = (status: ServiceStatus) => {
  if (status === 'aguardando_orcamento') {
    return {
      label: 'Enviar para aprovacao',
      nextStatus: 'aguardando_aprovacao' as const,
    };
  }

  if (status === 'aguardando_aprovacao') {
    return { label: 'Aguardar peca', nextStatus: 'aguardando_peca' as const };
  }

  if (status === 'aguardando_peca') {
    return { label: 'Iniciar conserto', nextStatus: 'em_conserto' as const };
  }

  if (status === 'em_conserto') {
    return {
      label: 'Marcar como pronto',
      nextStatus: 'pronto_para_retirada' as const,
    };
  }

  if (status === 'pronto_para_retirada') {
    return { label: 'Confirmar entrega', nextStatus: 'entregue' as const };
  }

  return null;
};
