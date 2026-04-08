import { PaymentMethod } from '../types';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  dinheiro: 'Dinheiro',
  pix: 'Pix',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
  transferencia: 'Transferência',
};

export const PAYMENT_METHOD_OPTIONS: PaymentMethod[] = [
  'dinheiro',
  'pix',
  'cartao_credito',
  'cartao_debito',
  'transferencia',
];

export const promptForPaymentMethod = () => {
  const value = window
    .prompt(
      `Informe a forma de pagamento:\n${PAYMENT_METHOD_OPTIONS.map((option) => `- ${option}`).join('\n')}`,
      'pix',
    )
    ?.trim() as PaymentMethod | undefined;

  if (!value) {
    return null;
  }

  return PAYMENT_METHOD_OPTIONS.includes(value) ? value : null;
};
