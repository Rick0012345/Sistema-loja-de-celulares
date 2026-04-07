import { FormEvent, useState } from 'react';
import {
  Banknote,
  LockKeyhole,
  Moon,
  ShieldCheck,
  Sun,
  UserCog,
  Wrench,
} from 'lucide-react';
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

const highlights = [
  {
    title: 'Ordens organizadas',
    description: 'Acompanhe entrada, execucao e entrega em um so lugar.',
    icon: Wrench,
  },
  {
    title: 'Estoque sob controle',
    description: 'Visualize pecas, reposicao e itens com baixa rapidamente.',
    icon: ShieldCheck,
  },
  {
    title: 'Financeiro mais claro',
    description: 'Veja valores, faturamento e margem com menos improviso.',
    icon: Banknote,
  },
] as const;

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

        <div className="max-w-2xl space-y-8">
          <div className="space-y-4">
            <p className="max-w-xl text-5xl font-black leading-[1.05]">
              Sua assistencia mais organizada do atendimento a entrega.
            </p>
            <p className="max-w-lg text-base leading-7 text-slate-300">
              Centralize ordens de servico, estoque e resultados em uma rotina mais simples para a equipe.
            </p>
          </div>

          <div className="grid max-w-3xl grid-cols-1 gap-4 xl:grid-cols-3">
            {highlights.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
                >
                  <div className="mb-4 inline-flex rounded-2xl bg-white/10 p-3 text-blue-100">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-lg font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm text-slate-300">
          <span>Painel para assistencias tecnicas</span>
          <span className="h-1 w-1 rounded-full bg-slate-500" />
          <span>Rotina mais visual</span>
          <span className="h-1 w-1 rounded-full bg-slate-500" />
          <span>Equipe mais alinhada</span>
        </div>
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
                name="nome"
                autoComplete="name"
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
                name="email"
                autoComplete="email"
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
                name="senha"
                autoComplete="new-password"
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
                name="email"
                autoComplete="username"
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
                name="senha"
                autoComplete="current-password"
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
