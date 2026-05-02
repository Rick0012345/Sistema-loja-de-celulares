import { FormEvent, useState } from 'react';
import { LockKeyhole, Moon, PackageCheck, ShieldCheck, Sun, Wrench } from 'lucide-react';
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
  'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-600';

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
    <div className="flex min-h-dvh bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="hidden flex-1 border-r border-slate-800 bg-slate-950 text-white lg:flex">
        <div className="flex w-full flex-col justify-between px-10 py-10 xl:px-14">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-white text-slate-950">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase text-slate-400">
                Sistema de gestão
              </p>
              <h1 className="text-2xl font-bold text-white">
                ConsertaSmart
              </h1>
            </div>
          </div>

          <div className="max-w-2xl space-y-6">
            <div className="space-y-3">
              <div className="inline-flex rounded-md border border-slate-700 px-3 py-1 text-xs font-semibold uppercase text-slate-300">
                Oficina, estoque e vendas no mesmo balcão
              </div>
              <p className="text-4xl font-semibold leading-tight text-balance text-white">
                Abra a loja já vendo o que precisa de atenção.
              </p>
              <p className="max-w-xl text-base leading-7 text-pretty text-slate-300">
                Acompanhe ordens de serviço, peças críticas, vendas e entregas em uma interface
                feita para rotina de balcão, não para apresentação bonita.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                <div className="mb-3 flex size-9 items-center justify-center rounded-md bg-slate-800 text-slate-200">
                  <Wrench size={16} />
                </div>
                <p className="text-sm font-semibold text-white">
                  Oficina
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Fila de OS, status, peças usadas e entrega.
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                <div className="mb-3 flex size-9 items-center justify-center rounded-md bg-slate-800 text-slate-200">
                  <PackageCheck size={16} />
                </div>
                <p className="text-sm font-semibold text-white">
                  Estoque
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Reposição, fornecedor e itens abaixo do mínimo.
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                <div className="mb-3 flex size-9 items-center justify-center rounded-md bg-slate-800 text-slate-200">
                  <ShieldCheck size={16} />
                </div>
                <p className="text-sm font-semibold text-white">
                  Controle
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Leitura rápida para decidir a próxima ação.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-400">
            <span className="rounded-md border border-slate-700 px-2.5 py-1">
              Ordens de serviço
            </span>
            <span className="rounded-md border border-slate-700 px-2.5 py-1">
              Estoque
            </span>
            <span className="rounded-md border border-slate-700 px-2.5 py-1">
              Vendas
            </span>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center p-5 lg:w-[440px] lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">
                Acesso
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
                Entrar no sistema
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Use suas credenciais para acessar a operação.
              </p>
            </div>

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
              className="inline-flex size-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>

          {errorMessage && (
            <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              {errorMessage}
            </div>
          )}

          <form onSubmit={(event) => void handleLogin(event)} className="mt-6 space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950">
                  <LockKeyhole size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-950 dark:text-white">
                    Login seguro
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Acesso individual por usuário.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
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

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
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
              className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200"
            >
              {isBusy ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
