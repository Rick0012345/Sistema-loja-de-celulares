import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;

  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (rest.length === 0) return `(${ddd})`;
  if (rest.length <= 4) return `(${ddd}) ${rest}`;

  const prefixLength = rest.length > 8 ? 5 : 4;
  const prefix = rest.slice(0, prefixLength);
  const suffix = rest.slice(prefixLength, prefixLength + 4);
  return `(${ddd}) ${prefix}-${suffix}`;
}
