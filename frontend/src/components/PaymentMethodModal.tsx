import { useEffect, useMemo, useState } from 'react';
import { CreditCard, ReceiptText, Wallet, X } from 'lucide-react';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_OPTIONS,
} from '../lib/paymentMethods';
import { cn, formatCurrency } from '../lib/utils';
import { PaymentMethod } from '../types';

type PaymentMethodModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  amount?: number | null;
  defaultValue?: PaymentMethod;
  isBusy?: boolean;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: (value: PaymentMethod) => void;
};

const optionIcon: Record<PaymentMethod, typeof Wallet> = {
  dinheiro: Wallet,
  pix: ReceiptText,
  cartao_credito: CreditCard,
  cartao_debito: CreditCard,
  transferencia: ReceiptText,
};

export const PaymentMethodModal = ({
  isOpen,
  title,
  description,
  amount,
  defaultValue = 'pix',
  isBusy = false,
  confirmLabel = 'Confirmar pagamento',
  onClose,
  onConfirm,
}: PaymentMethodModalProps) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setSelectedMethod(defaultValue);
    }
  }, [defaultValue, isOpen]);

  const amountLabel = useMemo(
    () => (typeof amount === 'number' ? formatCurrency(amount) : null),
    [amount],
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-950">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {title}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="rounded-xl p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X size={22} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {amountLabel && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
              <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                Valor a receber
              </div>
              <div className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-200">
                {amountLabel}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {PAYMENT_METHOD_OPTIONS.map((method) => {
              const Icon = optionIcon[method];

              return (
                <button
                  key={method}
                  type="button"
                  onClick={() => setSelectedMethod(method)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all',
                    selectedMethod === method
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-200'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-800/80',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'rounded-2xl p-2',
                        selectedMethod === method
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300',
                      )}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <div className="font-semibold">{PAYMENT_METHOD_LABELS[method]}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Registrar pagamento usando {PAYMENT_METHOD_LABELS[method].toLowerCase()}.
                      </div>
                    </div>
                  </div>
                  <div
                    className={cn(
                      'h-4 w-4 rounded-full border-2',
                      selectedMethod === method
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-slate-300 bg-transparent dark:border-slate-600',
                    )}
                  />
                </button>
              );
            })}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onConfirm(selectedMethod)}
              disabled={isBusy}
              className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-100 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
