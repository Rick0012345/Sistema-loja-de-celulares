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
    blue:
      'bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-100 dark:border-blue-500/20',
    emerald:
      'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-100 dark:border-emerald-500/20',
    amber:
      'bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-100 dark:border-amber-500/20',
    rose:
      'bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-100 dark:border-rose-500/20',
  };

  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900',
        isWarning &&
          'border-rose-200 bg-rose-50/30 dark:border-rose-500/30 dark:bg-rose-500/10',
      )}
    >
      <div className="mb-4 flex justify-between">
        <div className={cn('rounded-xl border p-3', colors[color])}>
          <Icon size={24} />
        </div>
      </div>
      <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {title}
      </h4>
      <div className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">
        {value}
      </div>
    </div>
  );
};
