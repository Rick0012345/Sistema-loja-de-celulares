import React from 'react';
import { cn } from '../lib/utils';

type StatCardProps = {
  title: string;
  value: string;
  icon: React.ComponentType<{ size?: number }>;
  color: 'blue' | 'emerald' | 'amber' | 'rose';
  isWarning?: boolean;
};

export const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  isWarning,
}: StatCardProps) => {
  const colors = {
    blue: 'border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-200',
    emerald: 'border-emerald-400 text-emerald-700 dark:border-emerald-500 dark:text-emerald-300',
    amber: 'border-amber-400 text-amber-700 dark:border-amber-500 dark:text-amber-300',
    rose: 'border-rose-400 text-rose-700 dark:border-rose-500 dark:text-rose-300',
  } as const;

  return (
    <div
      className={cn(
        'rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900',
        isWarning &&
          'border-rose-200 dark:border-rose-500/30',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{title}</p>
          <div className="mt-2 text-2xl font-semibold tabular-nums text-slate-950 dark:text-white">
            {value}
          </div>
        </div>
        <div className={cn('flex size-9 items-center justify-center rounded-lg border bg-white dark:bg-slate-950', colors[color])}>
          <Icon size={16} />
        </div>
      </div>
    </div>
  );
};
