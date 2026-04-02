import { formatCurrency } from '../lib/utils';
import { ServiceOrder } from '../types';

const panelClass =
  'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm';

type ProfitAnalysisViewProps = {
  services: ServiceOrder[];
};

export const ProfitAnalysisView = ({ services }: ProfitAnalysisViewProps) => {
  const profitData = [...services]
    .map((service) => {
      const partsCost = service.partsUsed.reduce(
        (accumulator, part) => accumulator + part.costPrice * part.quantity,
        0,
      );
      const profit = service.totalPrice - partsCost;
      const margin = service.totalPrice > 0 ? (profit / service.totalPrice) * 100 : 0;

      return { ...service, partsCost, profit, margin };
    })
    .sort(
      (first, second) =>
        new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
    );

  return (
    <div className="space-y-6">
      <div className={`${panelClass} overflow-hidden rounded-2xl`}>
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
              <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Servico / OS</th>
              <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Valor Cobrado</th>
              <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Custo Pecas</th>
              <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Lucro Bruto</th>
              <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Margem</th>
            </tr>
          </thead>
          <tbody>
            {profitData.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-500 dark:text-slate-400">
                  Ainda nao existem ordens de servico suficientes para analise.
                </td>
              </tr>
            )}
            {profitData.map((item) => (
              <tr key={item.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/70">
                <td className="p-4">
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    {item.deviceBrand} {item.deviceModel}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">
                    {item.id} • {item.customerName}
                  </div>
                </td>
                <td className="p-4 font-bold text-slate-900 dark:text-slate-100">{formatCurrency(item.totalPrice)}</td>
                <td className="p-4 font-medium text-rose-600">-{formatCurrency(item.partsCost)}</td>
                <td className="p-4 font-black text-emerald-600">{formatCurrency(item.profit)}</td>
                <td className="p-4">
                  <div className="h-2 w-full max-w-[100px] overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(item.margin, 100)}%` }} />
                  </div>
                  <span className="mt-1 block text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {item.margin.toFixed(1)}% de margem
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
