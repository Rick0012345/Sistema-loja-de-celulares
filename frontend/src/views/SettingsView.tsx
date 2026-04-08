import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { AuthenticatedUser, ManagedUser, UserProfile } from '../types';

type SettingsViewProps = {
  currentUser: AuthenticatedUser;
};

const profileLabels: Record<UserProfile, string> = {
  administrador: 'Administrador',
  atendente: 'Atendente',
  tecnico: 'Técnico',
  financeiro: 'Financeiro',
};

const panelClass =
  'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900';

const emptyForm = {
  nome: '',
  email: '',
  senha: '',
  perfil: 'atendente' as UserProfile,
};

export const SettingsView = ({ currentUser }: SettingsViewProps) => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const isAdmin = currentUser.perfil === 'administrador';

  const sortedUsers = useMemo(
    () =>
      [...users].sort(
        (first, second) =>
          new Date(second.created_at).getTime() - new Date(first.created_at).getTime(),
      ),
    [users],
  );

  const loadUsers = useCallback(async () => {
    if (!isAdmin) {
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.listUsers();
      setUsers(response);
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Nao foi possivel carregar usuários.');
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAdmin) {
      return;
    }
    setIsSaving(true);
    try {
      await api.createUser({
        nome: form.nome.trim(),
        email: form.email.trim(),
        senha: form.senha,
        perfil: form.perfil,
      });
      setForm(emptyForm);
      setMessage('Usuário criado com sucesso.');
      await loadUsers();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Nao foi possivel criar usuário.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleUserStatus = async (user: ManagedUser) => {
    if (!isAdmin || user.id === currentUser.id) {
      return;
    }
    setIsSaving(true);
    try {
      if (user.ativo) {
        await api.disableUser(user.id);
      } else {
        await api.updateUser(user.id, { ativo: true });
      }
      setMessage('Status de acesso atualizado.');
      await loadUsers();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Nao foi possivel atualizar o status.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const resetPassword = async (user: ManagedUser) => {
    if (!isAdmin || user.id === currentUser.id) {
      return;
    }
    const nextPassword = window.prompt(`Nova senha para ${user.nome}:`);
    if (!nextPassword) {
      return;
    }
    setIsSaving(true);
    try {
      await api.updateUser(user.id, { senha: nextPassword });
      setMessage('Senha redefinida com sucesso.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Nao foi possivel redefinir a senha.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefresh = async () => {
    await loadUsers();
  };

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  if (!isAdmin) {
    return (
      <div className={panelClass}>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Configurações</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Apenas administradores podem gerenciar logins de funcionários.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={panelClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Logins de Funcionários
          </h3>
          <button
            type="button"
            disabled={isLoading || isSaving}
            onClick={() => void handleRefresh()}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Atualizar lista
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Crie acessos extras para atendentes, técnicos e financeiro.
        </p>
        {message && (
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
            {message}
          </div>
        )}
      </div>

      <form onSubmit={(event) => void handleCreateUser(event)} className={panelClass}>
        <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Novo usuário
        </h4>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={form.nome}
            onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
            placeholder="Nome completo"
            required
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          />
          <input
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            placeholder="E-mail"
            type="email"
            required
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          />
          <input
            value={form.senha}
            onChange={(event) => setForm((current) => ({ ...current, senha: event.target.value }))}
            placeholder="Senha inicial"
            type="password"
            minLength={6}
            required
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          />
          <select
            value={form.perfil}
            onChange={(event) =>
              setForm((current) => ({ ...current, perfil: event.target.value as UserProfile }))
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          >
            {Object.entries(profileLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Criar login
        </button>
      </form>

      <div className={`${panelClass} overflow-hidden p-0`}>
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
              <th className="p-3.5 text-sm font-semibold text-slate-600 dark:text-slate-300">
                Nome
              </th>
              <th className="p-3.5 text-sm font-semibold text-slate-600 dark:text-slate-300">
                E-mail
              </th>
              <th className="p-3.5 text-sm font-semibold text-slate-600 dark:text-slate-300">
                Perfil
              </th>
              <th className="p-3.5 text-sm font-semibold text-slate-600 dark:text-slate-300">
                Status
              </th>
              <th className="p-3.5 text-sm font-semibold text-slate-600 dark:text-slate-300">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {!isLoading && sortedUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                  Nenhum usuário cadastrado.
                </td>
              </tr>
            )}
            {sortedUsers.map((user) => (
              <tr
                key={user.id}
                className="border-b border-slate-100 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/70"
              >
                <td className="p-3.5 text-sm font-medium text-slate-900 dark:text-slate-100">
                  {user.nome}
                </td>
                <td className="p-3.5 text-sm text-slate-600 dark:text-slate-300">{user.email}</td>
                <td className="p-3.5 text-sm text-slate-600 dark:text-slate-300">
                  {profileLabels[user.perfil]}
                </td>
                <td className="p-3.5 text-sm">
                  <span
                    className={
                      user.ativo
                        ? 'rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'
                        : 'rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 dark:bg-rose-500/10 dark:text-rose-300'
                    }
                  >
                    {user.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="p-3.5 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={isSaving || user.id === currentUser.id}
                      onClick={() => void toggleUserStatus(user)}
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      {user.ativo ? 'Desativar' : 'Reativar'}
                    </button>
                    <button
                      type="button"
                      disabled={isSaving || user.id === currentUser.id}
                      onClick={() => void resetPassword(user)}
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Redefinir senha
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
