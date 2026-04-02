import { AlertTriangle, CheckCircle2, Clock3, PackageCheck, Wrench } from 'lucide-react';
import { ServiceStatus } from '../types';

export const serviceStatusLabel: Record<ServiceStatus, string> = {
  pending: 'Pendente',
  in_progress: 'Em Conserto',
  ready: 'Pronto',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

export const serviceStatusBadgeClass: Record<ServiceStatus, string> = {
  pending: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  in_progress: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
  ready: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
  delivered: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
  cancelled: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
};

export const serviceStatusPanelClass: Record<ServiceStatus, string> = {
  pending:
    'border-slate-200 bg-white/85 dark:border-slate-800 dark:bg-slate-900/85',
  in_progress:
    'border-blue-200 bg-blue-50/70 dark:border-blue-500/30 dark:bg-blue-500/10',
  ready:
    'border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/30 dark:bg-emerald-500/10',
  delivered:
    'border-indigo-200 bg-indigo-50/70 dark:border-indigo-500/30 dark:bg-indigo-500/10',
  cancelled:
    'border-rose-200 bg-rose-50/70 dark:border-rose-500/30 dark:bg-rose-500/10',
};

export const workflowColumns: Array<{
  id: ServiceStatus;
  title: string;
  description: string;
  icon: typeof Clock3;
}> = [
  {
    id: 'pending',
    title: 'Fila de Entrada',
    description: 'Aguardando inicio, aprovacao ou peca.',
    icon: Clock3,
  },
  {
    id: 'in_progress',
    title: 'Bancada',
    description: 'Aparelhos em analise ou conserto ativo.',
    icon: Wrench,
  },
  {
    id: 'ready',
    title: 'Pronto para Retirada',
    description: 'Consertos finalizados aguardando cliente.',
    icon: PackageCheck,
  },
  {
    id: 'delivered',
    title: 'Entregues',
    description: 'Ordens concluidas e entregues.',
    icon: CheckCircle2,
  },
  {
    id: 'cancelled',
    title: 'Canceladas',
    description: 'Ordens encerradas sem entrega.',
    icon: AlertTriangle,
  },
];

export const getNextServiceAction = (status: ServiceStatus) => {
  if (status === 'pending') {
    return { label: 'Iniciar Conserto', nextStatus: 'in_progress' as const };
  }

  if (status === 'in_progress') {
    return { label: 'Marcar como Pronto', nextStatus: 'ready' as const };
  }

  if (status === 'ready') {
    return { label: 'Confirmar Entrega', nextStatus: 'delivered' as const };
  }

  return null;
};
