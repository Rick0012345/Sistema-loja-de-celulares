import { FormEvent, useState } from 'react';
import {
  Banknote,
  LockKeyhole,
  Moon,
  ShieldCheck,
  Sun,
  Wrench,
} from 'lucide-react';
import { motion } from 'motion/react';
import { ThemeMode } from '../types';

type AuthScreenProps = {
  errorMessage: string | null;
  isBusy: boolean;
  theme: ThemeMode;
  onLogin: (payload: { email: string; senha: string }) => Promise<void>;
  onToggleTheme: () => void;
};

const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500';

const highlights = [
  {
    title: 'Atendimento com contexto',
    description: 'A equipe encontra rapido o que esta em bancada, aguardando peca ou pronto para retirada.',
    icon: Wrench,
  },
  {
    title: 'Estoque mais previsivel',
    description: 'Reposicao e giro ficam mais visiveis para evitar correria e ruptura.',
    icon: ShieldCheck,
  },
  {
    title: 'Financeiro mais legivel',
    description: 'Venda, servico e recebimento aparecem em um fluxo mais direto e confiavel.',
    icon: Banknote,
  },
] as const;

export const AuthScreen = ({
  errorMessage,
  isBusy,
  theme,
  onLogin,
  onToggleTheme,
}: AuthScreenProps) => {
  const [loginForm, setLoginForm] = useState({
    email: '',
    senha: '',
  });

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    await onLogin(loginForm);
  };

  return (
    <div className="relative flex min-h-dvh overflow-hidden bg-slate-100 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-35">
        <div className="absolute left-[-10rem] top-[-8rem] h-64 w-64 rounded-full border border-blue-200 dark:border-blue-500/10" />
        <div className="absolute bottom-[-6rem] right-[-4rem] h-52 w-52 rounded-full border border-emerald-200 dark:border-emerald-500/10" />
      </div>

      <div className="relative hidden flex-1 px-8 py-10 lg:flex xl:px-12">
        <div className="flex w-full flex-col justify-between rounded-[36px] border border-slate-200 bg-white/80 p-8 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.55)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-[20px] bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <ShieldCheck size={28} />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-blue-600 dark:text-blue-300">
                Plataforma operacional
              </div>
              <h1 className="text-3xl font-extrabold text-slate-950 dark:text-white">
                ConsertaSmart
              </h1>
            </div>
          </div>

          <div className="max-w-3xl space-y-8">
            <div className="space-y-4">
              <p className="max-w-2xl text-5xl font-extrabold leading-[1.02] text-slate-950 dark:text-white">
                Um sistema que ajuda a loja a trabalhar com mais ritmo e menos improviso.
              </p>
              <p className="max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
                Organize ordens de servico, estoque e vendas em uma experiencia mais clara para quem atende, executa e entrega.
              </p>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              {highlights.map((item, index) => {
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, ease: 'easeOut', delay: index * 0.04 }}
                    className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <div className="mb-4 inline-flex rounded-2xl bg-blue-50 p-3 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                      <Icon size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                      {item.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
              OS e vendas no mesmo ambiente
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
              Fluxo mais visual
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
              Operacao mais previsivel
            </span>
          </div>
        </div>
      </div>

      <div className="relative flex w-full items-center justify-center p-5 lg:w-[520px] lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="w-full max-w-md rounded-[32px] border border-slate-200 bg-white/88 p-6 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.65)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/84"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-blue-600 dark:text-blue-300">
                Acesso seguro
              </p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-950 dark:text-white">
                Entrar no sistema
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Entre para acompanhar ordens, estoque e resultados com mais clareza.
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
              className="inline-flex size-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>

          {errorMessage && (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              {errorMessage}
            </div>
          )}

          <form onSubmit={(event) => void handleLogin(event)} className="mt-6 space-y-4">
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-900 p-3 text-white dark:bg-slate-100 dark:text-slate-950">
                  <LockKeyhole size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-950 dark:text-white">Login</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Use suas credenciais para continuar.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Email
              </label>
              <input
                required
                type="email"
                name="email"
                autoComplete="username"
                placeholder="seuemail@empresa.com"
                value={loginForm.email}
                onChange={(event) =>
                  setLoginForm((current) => ({ ...current, email: event.target.value }))
                }
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Senha
              </label>
              <input
                required
                type="password"
                name="senha"
                autoComplete="current-password"
                minLength={6}
                placeholder="Digite sua senha"
                value={loginForm.senha}
                onChange={(event) =>
                  setLoginForm((current) => ({ ...current, senha: event.target.value }))
                }
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={isBusy}
              className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBusy ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
