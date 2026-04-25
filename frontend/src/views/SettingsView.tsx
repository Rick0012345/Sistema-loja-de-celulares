import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { LoaderCircle, QrCode, RefreshCcw, Smartphone } from 'lucide-react';
import {
  ActionButton,
  DataTable,
  EmptyState,
  FormModal,
  PageHeader,
  Panel,
  StatusBadge,
} from '../components/ui/primitives';
import { api } from '../lib/api';
import {
  AuthenticatedUser,
  EvolutionInstanceOverview,
  ManagedUser,
  UserProfile,
} from '../types';

type SettingsViewProps = {
  currentUser: AuthenticatedUser;
};

const profileLabels: Record<UserProfile, string> = {
  administrador: 'Administrador',
  atendente: 'Atendente',
  tecnico: 'Tecnico',
  financeiro: 'Financeiro',
};

const inputClass =
  'mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200';

const emptyForm = {
  nome: '',
  email: '',
  senha: '',
  perfil: 'atendente' as UserProfile,
};

function normalizeQrCodeSource(qrCode: string | null) {
  if (!qrCode) {
    return null;
  }

  const trimmed = qrCode.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith('data:image')) {
    return trimmed;
  }

  if (/^[A-Za-z0-9+/=]+$/.test(trimmed) && trimmed.length > 300) {
    return `data:image/png;base64,${trimmed}`;
  }

  return null;
}

export const SettingsView = ({ currentUser }: SettingsViewProps) => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUserSaving, setIsUserSaving] = useState(false);
  const [isStoreLoading, setIsStoreLoading] = useState(false);
  const [isStoreSaving, setIsStoreSaving] = useState(false);
  const [isEvolutionLoading, setIsEvolutionLoading] = useState(false);
  const [isEvolutionSyncing, setIsEvolutionSyncing] = useState(false);
  const [isEvolutionRecovering, setIsEvolutionRecovering] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [storePhone, setStorePhone] = useState('');
  const [evolutionInstanceName, setEvolutionInstanceName] = useState('');
  const [evolutionApiBaseUrl, setEvolutionApiBaseUrl] = useState('');
  const [evolutionApiKeyInput, setEvolutionApiKeyInput] = useState('');
  const [isEvolutionApiKeyConfigured, setIsEvolutionApiKeyConfigured] =
    useState(false);
  const [ordemProntaWebhookUrl, setOrdemProntaWebhookUrl] = useState('');
  const [ordemProntaWebhookTokenInput, setOrdemProntaWebhookTokenInput] =
    useState('');
  const [
    isOrdemProntaWebhookTokenConfigured,
    setIsOrdemProntaWebhookTokenConfigured,
  ] = useState(false);
  const [evolutionOverview, setEvolutionOverview] =
    useState<EvolutionInstanceOverview | null>(null);
  const [qrCodeImageUrl, setQrCodeImageUrl] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const isAdmin = currentUser.perfil === 'administrador';

  const sortedUsers = useMemo(
    () =>
      [...users].sort(
        (first, second) =>
          new Date(second.created_at).getTime() -
          new Date(first.created_at).getTime(),
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
      setMessage(
        error instanceof Error
          ? error.message
          : 'Nao foi possivel carregar usuarios.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  const loadStoreSettings = useCallback(async () => {
    if (!isAdmin) {
      return;
    }
    setIsStoreLoading(true);
    try {
      const response = await api.getStoreSettings();
      setStorePhone(response.storePhone);
      setEvolutionInstanceName(response.evolutionInstanceName);
      setEvolutionApiBaseUrl(response.evolutionApiBaseUrl);
      setEvolutionApiKeyInput('');
      setIsEvolutionApiKeyConfigured(response.evolutionApiKeyConfigured);
      setOrdemProntaWebhookUrl(response.ordemProntaWebhookUrl);
      setOrdemProntaWebhookTokenInput('');
      setIsOrdemProntaWebhookTokenConfigured(
        response.ordemProntaWebhookTokenConfigured,
      );
      setMessage(null);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Nao foi possivel carregar as configuracoes da loja.',
      );
    } finally {
      setIsStoreLoading(false);
    }
  }, [isAdmin]);

  const loadEvolutionOverview = useCallback(async () => {
    if (!isAdmin) {
      return;
    }

    setIsEvolutionLoading(true);
    try {
      const response = await api.getEvolutionInstanceOverview();
      setEvolutionOverview(response);
    } catch (error) {
      setEvolutionOverview(null);
      setMessage(
        error instanceof Error
          ? error.message
          : 'Nao foi possivel consultar a instancia Evolution.',
      );
    } finally {
      setIsEvolutionLoading(false);
    }
  }, [isAdmin]);

  const handleSaveStoreSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAdmin) {
      return;
    }
    setIsStoreSaving(true);
    try {
      const response = await api.updateStoreSettings({
        storePhone,
        evolutionInstanceName,
        evolutionApiBaseUrl,
        ordemProntaWebhookUrl,
        ...(evolutionApiKeyInput.trim()
          ? { evolutionApiKey: evolutionApiKeyInput }
          : {}),
        ...(ordemProntaWebhookTokenInput.trim()
          ? { ordemProntaWebhookToken: ordemProntaWebhookTokenInput }
          : {}),
      });
      setStorePhone(response.storePhone);
      setEvolutionInstanceName(response.evolutionInstanceName);
      setEvolutionApiBaseUrl(response.evolutionApiBaseUrl);
      setEvolutionApiKeyInput('');
      setIsEvolutionApiKeyConfigured(response.evolutionApiKeyConfigured);
      setOrdemProntaWebhookUrl(response.ordemProntaWebhookUrl);
      setOrdemProntaWebhookTokenInput('');
      setIsOrdemProntaWebhookTokenConfigured(
        response.ordemProntaWebhookTokenConfigured,
      );
      setMessage('Configuracoes da loja salvas com sucesso.');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Nao foi possivel salvar as configuracoes da loja.',
      );
    } finally {
      setIsStoreSaving(false);
    }
  };

  const persistCurrentStoreSettings = useCallback(async () => {
    const response = await api.updateStoreSettings({
      storePhone,
      evolutionInstanceName,
      evolutionApiBaseUrl,
      ordemProntaWebhookUrl,
      ...(evolutionApiKeyInput.trim()
        ? { evolutionApiKey: evolutionApiKeyInput }
        : {}),
      ...(ordemProntaWebhookTokenInput.trim()
        ? { ordemProntaWebhookToken: ordemProntaWebhookTokenInput }
        : {}),
    });

    setStorePhone(response.storePhone);
    setEvolutionInstanceName(response.evolutionInstanceName);
    setEvolutionApiBaseUrl(response.evolutionApiBaseUrl);
    setEvolutionApiKeyInput('');
    setIsEvolutionApiKeyConfigured(response.evolutionApiKeyConfigured);
    setOrdemProntaWebhookUrl(response.ordemProntaWebhookUrl);
    setOrdemProntaWebhookTokenInput('');
    setIsOrdemProntaWebhookTokenConfigured(
      response.ordemProntaWebhookTokenConfigured,
    );
  }, [
    evolutionApiBaseUrl,
    evolutionApiKeyInput,
    evolutionInstanceName,
    ordemProntaWebhookTokenInput,
    ordemProntaWebhookUrl,
    storePhone,
  ]);

  const openQrModal = useCallback(
    async (qrCode: string | null, nextPairingCode: string | null) => {
      const directImage = normalizeQrCodeSource(qrCode);
      setQrCodeImageUrl(directImage);
      setPairingCode(nextPairingCode);
      setIsQrModalOpen(true);
    },
    [],
  );

  const closeQrModal = useCallback(() => {
    setIsQrModalOpen(false);
    setQrCodeImageUrl(null);
    setPairingCode(null);
  }, []);

  const syncEvolutionInstance = useCallback(
    async (mode: 'create' | 'connect') => {
      if (!isAdmin) {
        return;
      }

      setIsEvolutionSyncing(true);
      try {
        await persistCurrentStoreSettings();
        const response =
          mode === 'create'
            ? await api.createEvolutionInstance()
            : await api.connectEvolutionInstance();

        if (response.qrCode || response.pairingCode) {
          await openQrModal(response.qrCode, response.pairingCode);
        }

        await loadEvolutionOverview();
        setMessage(
          response.warning ??
            (mode === 'create'
              ? 'Instancia criada e QR Code gerado com sucesso.'
              : 'QR Code atualizado com sucesso.'),
        );
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : 'Nao foi possivel sincronizar a instancia Evolution.',
        );
      } finally {
        setIsEvolutionSyncing(false);
      }
    },
    [isAdmin, loadEvolutionOverview, openQrModal, persistCurrentStoreSettings],
  );

  const recoverEvolutionInstance = useCallback(
    async (mode: 'restart' | 'logout' | 'recreate') => {
      if (!isAdmin) {
        return;
      }

      setIsEvolutionRecovering(true);
      try {
        await persistCurrentStoreSettings();

        if (mode === 'restart') {
          const response = await api.restartEvolutionInstance();
          await loadEvolutionOverview();
          setMessage(response.message);
          return;
        }

        if (mode === 'logout') {
          const response = await api.logoutEvolutionInstance();
          await loadEvolutionOverview();
          setMessage(response.message);
          return;
        }

        const response = await api.recreateEvolutionInstance();

        if (response.qrCode || response.pairingCode) {
          await openQrModal(response.qrCode, response.pairingCode);
        }

        await loadEvolutionOverview();
        setMessage(
          response.warning ?? 'Instancia recriada com sucesso na Evolution API.',
        );
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : 'Nao foi possivel executar a recuperacao da instancia Evolution.',
        );
      } finally {
        setIsEvolutionRecovering(false);
      }
    },
    [
      isAdmin,
      loadEvolutionOverview,
      openQrModal,
      persistCurrentStoreSettings,
    ],
  );

  const connectionStatusLabel = useMemo(() => {
    switch (evolutionOverview?.connectionStatus) {
      case 'open':
        return 'Conectada';
      case 'close':
      case 'closed':
        return 'Desconectada';
      case 'connecting':
        return 'Conectando';
      case 'not_found':
        return 'Instancia nao encontrada';
      case 'created':
        return 'Instancia criada';
      default:
        return evolutionOverview?.connectionStatus
          ? evolutionOverview.connectionStatus
          : 'Nao verificado';
    }
  }, [evolutionOverview]);

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAdmin) {
      return;
    }
    setIsUserSaving(true);
    try {
      await api.createUser({
        nome: form.nome.trim(),
        email: form.email.trim(),
        senha: form.senha,
        perfil: form.perfil,
      });
      setForm(emptyForm);
      setMessage('Usuario criado com sucesso.');
      await loadUsers();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Nao foi possivel criar usuario.',
      );
    } finally {
      setIsUserSaving(false);
    }
  };

  const toggleUserStatus = async (user: ManagedUser) => {
    if (!isAdmin || user.id === currentUser.id) {
      return;
    }
    setIsUserSaving(true);
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
        error instanceof Error
          ? error.message
          : 'Nao foi possivel atualizar o status.',
      );
    } finally {
      setIsUserSaving(false);
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
    setIsUserSaving(true);
    try {
      await api.updateUser(user.id, { senha: nextPassword });
      setMessage('Senha redefinida com sucesso.');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Nao foi possivel redefinir a senha.',
      );
    } finally {
      setIsUserSaving(false);
    }
  };

  useEffect(() => {
    void loadUsers();
    void loadStoreSettings();
    void loadEvolutionOverview();
  }, [loadEvolutionOverview, loadStoreSettings, loadUsers]);

  if (!isAdmin) {
    return (
      <Panel>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Configuracoes
        </h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Apenas administradores podem gerenciar as configuracoes da loja.
        </p>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuracoes"
        description="Centralize credenciais, integrações e acessos internos em um fluxo mais previsível."
      />

      {message ? (
        <Panel compact className="border-slate-300 bg-slate-50 dark:bg-slate-950">
          <p className="text-sm text-slate-700 dark:text-slate-200">{message}</p>
        </Panel>
      ) : null}

      <form onSubmit={(event) => void handleSaveStoreSettings(event)} className="space-y-6">
        <Panel>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Dados da loja e integracoes
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Mantenha aqui os dados usados no envio de notificacoes e na conexao com a Evolution API.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-sm text-slate-600 dark:text-slate-300">
              Telefone da loja
              <input
                value={storePhone}
                onChange={(event) => setStorePhone(event.target.value)}
                placeholder="(11) 99999-9999"
                type="tel"
                className={inputClass}
              />
            </label>
            <label className="text-sm text-slate-600 dark:text-slate-300">
              Nome da instancia Evolution
              <input
                value={evolutionInstanceName}
                onChange={(event) => setEvolutionInstanceName(event.target.value)}
                placeholder="Instancia-conserto-celular"
                type="text"
                className={inputClass}
              />
            </label>
            <label className="text-sm text-slate-600 dark:text-slate-300">
              URL base da Evolution API
              <input
                value={evolutionApiBaseUrl}
                onChange={(event) => setEvolutionApiBaseUrl(event.target.value)}
                placeholder="http://evolution-api:8080"
                type="text"
                className={inputClass}
              />
            </label>
            <label className="text-sm text-slate-600 dark:text-slate-300">
              API key da Evolution
              <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                {isEvolutionApiKeyConfigured
                  ? 'Ja configurada. Preencha apenas para substituir.'
                  : 'Ainda nao configurada.'}
              </span>
              <input
                value={evolutionApiKeyInput}
                onChange={(event) => setEvolutionApiKeyInput(event.target.value)}
                placeholder={
                  isEvolutionApiKeyConfigured
                    ? 'Digite uma nova API key para substituir'
                    : 'API key da Evolution'
                }
                type="password"
                className={inputClass}
                autoComplete="new-password"
              />
            </label>
            <label className="text-sm text-slate-600 dark:text-slate-300">
              URL do webhook da OS pronta
              <input
                value={ordemProntaWebhookUrl}
                onChange={(event) => setOrdemProntaWebhookUrl(event.target.value)}
                placeholder="http://localhost:5678/webhook/ordem-servico-pronta"
                type="text"
                className={inputClass}
              />
            </label>
            <label className="text-sm text-slate-600 dark:text-slate-300">
              Token do webhook
              <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                {isOrdemProntaWebhookTokenConfigured
                  ? 'Ja configurado. Preencha apenas para substituir.'
                  : 'Ainda nao configurado.'}
              </span>
              <input
                value={ordemProntaWebhookTokenInput}
                onChange={(event) =>
                  setOrdemProntaWebhookTokenInput(event.target.value)
                }
                placeholder={
                  isOrdemProntaWebhookTokenConfigured
                    ? 'Digite um novo token para substituir'
                    : 'Token do webhook'
                }
                type="password"
                className={inputClass}
                autoComplete="new-password"
              />
            </label>
          </div>
        </Panel>

        <Panel>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <Smartphone size={16} />
                Conexao com WhatsApp da loja
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Crie, conecte e recupere a instancia da loja usando as credenciais salvas acima.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge>
                  Instancia:{' '}
                  {evolutionOverview?.instanceName || evolutionInstanceName || 'Nao informada'}
                </StatusBadge>
                <StatusBadge tone={evolutionOverview?.ownerJid ? 'success' : 'neutral'}>
                  Status: {isEvolutionLoading ? 'Consultando...' : connectionStatusLabel}
                </StatusBadge>
                {evolutionOverview?.ownerJid ? (
                  <StatusBadge tone="success">
                    Conta: {evolutionOverview.ownerJid}
                  </StatusBadge>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <ActionButton
                onClick={() => void loadEvolutionOverview()}
                disabled={
                  isEvolutionLoading || isEvolutionSyncing || isEvolutionRecovering
                }
              >
                <RefreshCcw size={16} />
                Atualizar status
              </ActionButton>
              <ActionButton
                variant="secondary"
                onClick={() => void syncEvolutionInstance('create')}
                disabled={
                  isStoreSaving ||
                  isEvolutionSyncing ||
                  isEvolutionRecovering ||
                  evolutionOverview?.exists === true
                }
              >
                {isEvolutionSyncing ? 'Sincronizando...' : 'Criar instancia'}
              </ActionButton>
              <ActionButton
                variant="primary"
                onClick={() => void syncEvolutionInstance('connect')}
                disabled={
                  isStoreSaving ||
                  isEvolutionSyncing ||
                  isEvolutionRecovering ||
                  evolutionOverview?.exists === false
                }
              >
                {isEvolutionSyncing ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <QrCode size={16} />
                )}
                Conectar / gerar QR
              </ActionButton>
              <ActionButton
                variant="warning"
                onClick={() => void recoverEvolutionInstance('restart')}
                disabled={
                  isStoreSaving ||
                  isEvolutionSyncing ||
                  isEvolutionRecovering ||
                  evolutionOverview?.exists === false
                }
              >
                {isEvolutionRecovering ? 'Processando...' : 'Reiniciar instancia'}
              </ActionButton>
              <ActionButton
                variant="danger"
                onClick={() => void recoverEvolutionInstance('logout')}
                disabled={
                  isStoreSaving ||
                  isEvolutionSyncing ||
                  isEvolutionRecovering ||
                  evolutionOverview?.exists === false
                }
              >
                {isEvolutionRecovering ? 'Processando...' : 'Deslogar sessao'}
              </ActionButton>
              <ActionButton
                variant="secondary"
                onClick={() => void recoverEvolutionInstance('recreate')}
                disabled={isStoreSaving || isEvolutionSyncing || isEvolutionRecovering}
              >
                {isEvolutionRecovering ? 'Processando...' : 'Recriar instancia'}
              </ActionButton>
            </div>
          </div>
        </Panel>

        <div className="flex justify-end">
          <ActionButton type="submit" variant="primary" disabled={isStoreLoading || isStoreSaving}>
            {isStoreSaving ? 'Salvando...' : 'Salvar configuracoes'}
          </ActionButton>
        </div>
      </form>

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Logins de funcionarios
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Crie acessos extras para atendimento, tecnico e financeiro.
            </p>
          </div>
          <ActionButton
            disabled={isLoading || isUserSaving}
            onClick={() => void loadUsers()}
          >
            Atualizar lista
          </ActionButton>
        </div>
      </Panel>

      <form onSubmit={(event) => void handleCreateUser(event)}>
        <Panel>
          <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Novo usuario
          </h4>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input
              value={form.nome}
              onChange={(event) =>
                setForm((current) => ({ ...current, nome: event.target.value }))
              }
              placeholder="Nome completo"
              required
              className={inputClass.replace('mt-1 ', '')}
            />
            <input
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
              placeholder="E-mail"
              type="email"
              required
              className={inputClass.replace('mt-1 ', '')}
            />
            <input
              value={form.senha}
              onChange={(event) =>
                setForm((current) => ({ ...current, senha: event.target.value }))
              }
              placeholder="Senha inicial"
              type="password"
              minLength={6}
              required
              className={inputClass.replace('mt-1 ', '')}
            />
            <select
              value={form.perfil}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  perfil: event.target.value as UserProfile,
                }))
              }
              className={inputClass.replace('mt-1 ', '')}
            >
              {Object.entries(profileLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4 flex justify-end">
            <ActionButton type="submit" variant="primary" disabled={isUserSaving}>
              Criar login
            </ActionButton>
          </div>
        </Panel>
      </form>

      <DataTable>
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
              <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                Nome
              </th>
              <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                E-mail
              </th>
              <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                Perfil
              </th>
              <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                Status
              </th>
              <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                Acoes
              </th>
            </tr>
          </thead>
          <tbody>
            {!isLoading && sortedUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4">
                  <EmptyState
                    title="Nenhum usuario cadastrado"
                    description="Crie o primeiro login adicional para distribuir atendimento e operacao."
                  />
                </td>
              </tr>
            ) : null}
            {sortedUsers.map((user) => (
              <tr
                key={user.id}
                className="border-b border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/70"
              >
                <td className="p-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                  {user.nome}
                </td>
                <td className="p-3 text-sm text-slate-600 dark:text-slate-300">
                  {user.email}
                </td>
                <td className="p-3 text-sm text-slate-600 dark:text-slate-300">
                  {profileLabels[user.perfil]}
                </td>
                <td className="p-3 text-sm">
                  <StatusBadge tone={user.ativo ? 'success' : 'danger'}>
                    {user.ativo ? 'Ativo' : 'Inativo'}
                  </StatusBadge>
                </td>
                <td className="p-3 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <ActionButton
                      disabled={isUserSaving || user.id === currentUser.id}
                      onClick={() => void toggleUserStatus(user)}
                    >
                      {user.ativo ? 'Desativar' : 'Reativar'}
                    </ActionButton>
                    <ActionButton
                      disabled={isUserSaving || user.id === currentUser.id}
                      onClick={() => void resetPassword(user)}
                    >
                      Redefinir senha
                    </ActionButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTable>

      <FormModal
        isOpen={isQrModalOpen}
        onClose={closeQrModal}
        title="Conectar WhatsApp da instancia"
        description="Escaneie o QR Code abaixo com o WhatsApp Web do numero da loja."
        maxWidthClassName="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            {qrCodeImageUrl ? (
              <img
                src={qrCodeImageUrl}
                alt="QR Code para conectar a instancia WhatsApp"
                className="size-72 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700"
              />
            ) : (
              <div className="flex size-72 items-center justify-center rounded-lg border border-dashed border-slate-300 px-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                O QR Code nao veio como imagem. Gere um novo QR para tentar novamente.
              </div>
            )}
          </div>

          {pairingCode ? (
            <Panel compact className="border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Codigo de pareamento: <span className="font-semibold">{pairingCode}</span>
              </p>
            </Panel>
          ) : null}

          <Panel compact className="bg-slate-50 dark:bg-slate-950">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Se o QR expirar, clique em <strong>Conectar / gerar QR</strong> novamente.
              Depois de escanear, use <strong>Atualizar status</strong> para confirmar que a
              instancia ficou conectada.
            </p>
          </Panel>
        </div>
      </FormModal>
    </div>
  );
};
