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
    blue: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  } as const;

  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900',
        isWarning &&
          'border-rose-200 dark:border-rose-500/30',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <div className="mt-2 text-2xl font-bold tabular-nums text-slate-950 dark:text-white">
            {value}
          </div>
        </div>
        <div className={cn('flex size-9 items-center justify-center rounded-lg', colors[color])}>
          <Icon size={16} />
        </div>
      </div>
    </div>
  );
};
