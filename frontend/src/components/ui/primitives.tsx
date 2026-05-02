import { ButtonHTMLAttributes, ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
  metrics?: Array<{
    label: string;
    value: ReactNode;
  }>;
};

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  metrics,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 dark:border-slate-800 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-xl font-semibold text-balance text-slate-950 dark:text-slate-50">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 max-w-3xl text-sm text-pretty text-slate-500 dark:text-slate-400">
            {description}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {metrics && metrics.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:flex">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="min-w-24 rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900"
              >
                <p className="text-xs text-slate-500 dark:text-slate-400">{metric.label}</p>
                <p className="text-sm font-semibold tabular-nums text-slate-950 dark:text-slate-50">
                  {metric.value}
                </p>
              </div>
            ))}
          </div>
        ) : null}
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

type PanelProps = {
  children: ReactNode;
  className?: string;
  compact?: boolean;
};

export function Panel({ children, className, compact = false }: PanelProps) {
  return (
    <section
      className={cn(
        'rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900',
        compact ? 'p-4' : 'p-5',
        className,
      )}
    >
      {children}
    </section>
  );
}

type ToolbarProps = {
  children: ReactNode;
  className?: string;
};

export function Toolbar({ children, className }: ToolbarProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between',
        className,
      )}
    >
      {children}
    </div>
  );
}

type ActionButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'success'
  | 'warning';

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ActionButtonVariant;
};

const actionButtonClasses: Record<ActionButtonVariant, string> = {
  primary:
    'border border-slate-900 bg-slate-900 text-white hover:bg-slate-800 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white',
  secondary:
    'border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
  ghost:
    'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800',
  danger:
    'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20',
  success:
    'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20',
  warning:
    'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20',
};

export function ActionButton({
  className,
  variant = 'ghost',
  type = 'button',
  ...props
}: ActionButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
        actionButtonClasses[variant],
        className,
      )}
      {...props}
    />
  );
}

type MetricCardProps = {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: 'default' | 'success' | 'warning';
};

const metricToneClasses = {
  default: 'text-slate-500 dark:text-slate-400',
  success: 'text-emerald-600 dark:text-emerald-300',
  warning: 'text-amber-600 dark:text-amber-300',
};

export function MetricCard({
  label,
  value,
  icon,
  tone = 'default',
}: MetricCardProps) {
  return (
    <Panel compact className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
        {icon ? (
          <span className={cn('shrink-0', metricToneClasses[tone])}>{icon}</span>
        ) : null}
      </div>
      <div className="text-2xl font-semibold tabular-nums text-slate-950 dark:text-slate-50">
        {value}
      </div>
    </Panel>
  );
}

type StatusBadgeProps = {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'danger' | 'warning';
  className?: string;
};

const badgeToneClasses = {
  neutral:
    'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
  danger:
    'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300',
  warning:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
};

export function StatusBadge({
  children,
  tone = 'neutral',
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold',
        badgeToneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center dark:border-slate-700">
      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </div>
      <p className="mt-1 text-sm text-pretty text-slate-500 dark:text-slate-400">
        {description}
      </p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

type FormModalProps = {
  title: string;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClassName?: string;
};

export function FormModal({
  title,
  description,
  isOpen,
  onClose,
  children,
  footer,
  maxWidthClassName = 'max-w-2xl',
}: FormModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
          maxWidthClassName,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-balance text-slate-950 dark:text-slate-50">
              {title}
            </h3>
            {description ? (
              <p className="mt-1 text-sm text-pretty text-slate-500 dark:text-slate-400">
                {description}
              </p>
            ) : null}
          </div>
          <ActionButton
            aria-label="Fechar modal"
            variant="ghost"
            className="px-2.5 py-2"
            onClick={onClose}
          >
            <X size={16} />
          </ActionButton>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
        {footer ? (
          <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

type DataTableProps = {
  children: ReactNode;
  className?: string;
};

export function DataTable({ children, className }: DataTableProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
        className,
      )}
    >
      {children}
    </div>
  );
}

export const inputClassName =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-600';

type FieldProps = {
  label: string;
  children: ReactNode;
  className?: string;
  hint?: ReactNode;
};

export function Field({ label, children, className, hint }: FieldProps) {
  return (
    <label className={cn('block space-y-1.5', className)}>
      <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="block text-xs text-slate-500 dark:text-slate-400">{hint}</span>
      ) : null}
    </label>
  );
}

type SectionTitleProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function SectionTitle({ title, description, action }: SectionTitleProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="text-base font-semibold text-balance text-slate-950 dark:text-slate-50">
          {title}
        </h3>
        {description ? (
          <p className="mt-1 text-sm text-pretty text-slate-500 dark:text-slate-400">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function TableHeaderCell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        'whitespace-nowrap px-3 py-3 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400',
        className,
      )}
    >
      {children}
    </th>
  );
}
