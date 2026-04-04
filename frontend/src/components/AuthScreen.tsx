import { FormEvent, useMemo, useState } from 'react';
import { LockKeyhole, Moon, ShieldCheck, Sun, UserCog } from 'lucide-react';
import { ThemeMode } from '../types';

type AuthScreenProps = {
  canBootstrap: boolean;
  errorMessage: string | null;
  isBusy: boolean;
  theme: ThemeMode;
  onBootstrap: (payload: { nome: string; email: string; senha: string }) => Promise<void>;
  onLogin: (payload: { email: string; senha: string }) => Promise<void>;
  onToggleTheme: () => void;
};

const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500';

export const AuthScreen = ({
  canBootstrap,
  errorMessage,
  isBusy,
  theme,
  onBootstrap,
  onLogin,
  onToggleTheme,
}: AuthScreenProps) => {
  const [bootstrapForm, setBootstrapForm] = useState({
    nome: '',
    email: '',
    senha: '',
  });
  const [loginForm, setLoginForm] = useState({
    email: '',
    senha: '',
  });

  const helperText = useMemo(
    () =>
      canBootstrap ? 'Cadastre o primeiro usuario.' : '',
    [canBootstrap],
  );

  const handleBootstrap = async (event: FormEvent) => {
    event.preventDefault();
    await onBootstrap(bootstrapForm);
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    await onLogin(loginForm);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <div className="hidden flex-1 flex-col justify-between bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-10 text-white lg:flex">
        <div className="inline-flex items-center gap-3">
          <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
            <ShieldCheck size={28} />
          </div>
          <div>
            <div className="text-sm uppercase tracking-[0.24em] text-blue-200">
              ConsertaSmart
            </div>
            <h1 className="text-3xl font-black">Acesso</h1>
          </div>
        </div>

        <div className="max-w-lg">
          <p className="text-4xl font-black leading-tight">ConsertaSmart</p>
        </div>

        <div />
      </div>

      <div className="flex w-full items-center justify-center p-6 lg:w-[520px]">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
                Acesso
              </p>
              <h2 className="mt-2 text-3xl font-black">
                {canBootstrap ? 'Criar usuario' : 'Entrar'}
              </h2>
              {helperText && (
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {helperText}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onToggleTheme}
              className="rounded-full border border-slate-200 bg-white p-3 text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>

          {errorMessage && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              {errorMessage}
            </div>
          )}

          {canBootstrap ? (
            <form
              onSubmit={(event) => void handleBootstrap(event)}
              className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                  <UserCog size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold">Primeiro usuario</h3>
                </div>
              </div>

              <input
                required
                placeholder="Nome"
                value={bootstrapForm.nome}
                onChange={(event) =>
                  setBootstrapForm((current) => ({ ...current, nome: event.target.value }))
                }
                className={inputClass}
              />
              <input
                required
                type="email"
                placeholder="Email"
                value={bootstrapForm.email}
                onChange={(event) =>
                  setBootstrapForm((current) => ({ ...current, email: event.target.value }))
                }
                className={inputClass}
              />
              <input
                required
                type="password"
                minLength={6}
                placeholder="Senha"
                value={bootstrapForm.senha}
                onChange={(event) =>
                  setBootstrapForm((current) => ({ ...current, senha: event.target.value }))
                }
                className={inputClass}
              />

              <button
                type="submit"
                disabled={isBusy}
                className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isBusy ? 'Salvando...' : 'Continuar'}
              </button>
            </form>
          ) : (
            <form
              onSubmit={(event) => void handleLogin(event)}
              className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <LockKeyhole size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold">Login</h3>
                </div>
              </div>

              <input
                required
                type="email"
                placeholder="Email"
                value={loginForm.email}
                onChange={(event) =>
                  setLoginForm((current) => ({ ...current, email: event.target.value }))
                }
                className={inputClass}
              />
              <input
                required
                type="password"
                minLength={6}
                placeholder="Senha"
                value={loginForm.senha}
                onChange={(event) =>
                  setLoginForm((current) => ({ ...current, senha: event.target.value }))
                }
                className={inputClass}
              />

              <button
                type="submit"
                disabled={isBusy}
                className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isBusy ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
