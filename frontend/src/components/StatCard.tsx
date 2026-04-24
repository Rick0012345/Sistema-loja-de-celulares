import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
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
    blue: {
      badge:
        'border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/15 dark:text-blue-300',
      stripe: 'bg-blue-600',
    },
    emerald: {
      badge:
        'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300',
      stripe: 'bg-emerald-500',
    },
    amber: {
      badge:
        'border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300',
      stripe: 'bg-amber-500',
    },
    rose: {
      badge:
        'border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/15 dark:text-rose-300',
      stripe: 'bg-rose-500',
    },
  } as const;

  const palette = colors[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={cn(
        'relative overflow-hidden rounded-[26px] border border-slate-200/90 bg-white p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.55)] dark:border-slate-800/90 dark:bg-slate-900',
        isWarning &&
          'border-rose-200 bg-rose-50/40 dark:border-rose-500/30 dark:bg-rose-500/10',
      )}
    >
      <span className={cn('absolute inset-x-0 top-0 h-1.5', palette.stripe)} />

      <div className="flex items-start justify-between gap-4">
        <div className={cn('rounded-2xl border p-3', palette.badge)}>
          <Icon size={20} />
        </div>
        <div className="rounded-full bg-slate-100 p-2 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
          <ArrowUpRight size={16} />
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</p>
        <div className="mt-2 text-2xl font-extrabold tabular-nums text-slate-950 dark:text-white">
          {value}
        </div>
      </div>
    </motion.div>
  );
};
