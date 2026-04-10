import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { LoaderCircle, QrCode, RefreshCcw, Smartphone, X } from 'lucide-react';
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

const panelClass =
  'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900';

const inputClass =
  'mt-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200';

const emptyForm = {
  nome: '',
  email: '',
  senha: '',
  perfil: 'atendente' as UserProfile,
};

const QR_MODAL_TITLE_ID = 'evolution-qr-modal-title';
const QR_MODAL_DESCRIPTION_ID = 'evolution-qr-modal-description';

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
  const [evolutionApiKey, setEvolutionApiKey] = useState('');
  const [ordemProntaWebhookUrl, setOrdemProntaWebhookUrl] = useState('');
  const [ordemProntaWebhookToken, setOrdemProntaWebhookToken] = useState('');
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
      setEvolutionApiKey(response.evolutionApiKey);
      setOrdemProntaWebhookUrl(response.ordemProntaWebhookUrl);
      setOrdemProntaWebhookToken(response.ordemProntaWebhookToken);
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
        evolutionApiKey,
        ordemProntaWebhookUrl,
        ordemProntaWebhookToken,
      });
      setStorePhone(response.storePhone);
      setEvolutionInstanceName(response.evolutionInstanceName);
      setEvolutionApiBaseUrl(response.evolutionApiBaseUrl);
      setEvolutionApiKey(response.evolutionApiKey);
      setOrdemProntaWebhookUrl(response.ordemProntaWebhookUrl);
      setOrdemProntaWebhookToken(response.ordemProntaWebhookToken);
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
      evolutionApiKey,
      ordemProntaWebhookUrl,
      ordemProntaWebhookToken,
    });

    setStorePhone(response.storePhone);
    setEvolutionInstanceName(response.evolutionInstanceName);
    setEvolutionApiBaseUrl(response.evolutionApiBaseUrl);
    setEvolutionApiKey(response.evolutionApiKey);
    setOrdemProntaWebhookUrl(response.ordemProntaWebhookUrl);
    setOrdemProntaWebhookToken(response.ordemProntaWebhookToken);
  }, [
    evolutionApiBaseUrl,
    evolutionApiKey,
    evolutionInstanceName,
    ordemProntaWebhookToken,
    ordemProntaWebhookUrl,
    storePhone,
  ]);

  const openQrModal = useCallback(
    async (qrCode: string | null, nextPairingCode: string | null) => {
      const directImage = normalizeQrCodeSource(qrCode);

      if (directImage) {
        setQrCodeImageUrl(directImage);
      } else {
        setQrCodeImageUrl(null);
      }

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
        if (response.warning) {
          setMessage(response.warning);
        } else {
          setMessage(
            mode === 'create'
              ? 'Instancia criada e QR Code gerado com sucesso.'
              : 'QR Code atualizado com sucesso.',
          );
        }
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

  const handleRefresh = async () => {
    await loadUsers();
  };

  useEffect(() => {
    void loadUsers();
    void loadStoreSettings();
    void loadEvolutionOverview();
  }, [loadEvolutionOverview, loadStoreSettings, loadUsers]);

  if (!isAdmin) {
    return (
      <div className={panelClass}>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Configuracoes
        </h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Apenas administradores podem gerenciar as configuracoes da loja.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={panelClass}>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Dados da loja
        </h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Configure aqui todos os dados usados no disparo de notificacoes da OS
          pronta, sem depender de variaveis de ambiente no workflow.
        </p>
        {message && (
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
            {message}
          </div>
        )}
      </div>

      <form
        onSubmit={(event) => void handleSaveStoreSettings(event)}
        className={panelClass}
      >
        <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Integracoes da loja
        </h4>
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
            <input
              value={evolutionApiKey}
              onChange={(event) => setEvolutionApiKey(event.target.value)}
              placeholder="API key da Evolution"
              type="password"
              className={inputClass}
            />
          </label>
          <label className="text-sm text-slate-600 dark:text-slate-300">
            URL do webhook da OS pronta
            <input
              value={ordemProntaWebhookUrl}
              onChange={(event) => setOrdemProntaWebhookUrl(event.target.value)}
              placeholder="http://n8n:5678/webhook/ordem-servico-pronta"
              type="text"
              className={inputClass}
            />
          </label>
          <label className="text-sm text-slate-600 dark:text-slate-300">
            Token do webhook
            <input
              value={ordemProntaWebhookToken}
              onChange={(event) => setOrdemProntaWebhookToken(event.target.value)}
              placeholder="Token do webhook"
              type="password"
              className={inputClass}
            />
          </label>
        </div>
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <Smartphone size={16} />
                Conexao com WhatsApp da loja
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Crie a instancia e gere o QR Code por aqui. O sistema usa as
                credenciais salvas acima para conversar com a Evolution API.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  Instancia:{' '}
                  {evolutionOverview?.instanceName ||
                    evolutionInstanceName ||
                    'Nao informada'}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  Status: {isEvolutionLoading ? 'Consultando...' : connectionStatusLabel}
                </span>
                {evolutionOverview?.ownerJid && (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                    Conta: {evolutionOverview.ownerJid}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void loadEvolutionOverview()}
                disabled={
                  isEvolutionLoading || isEvolutionSyncing || isEvolutionRecovering
                }
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <RefreshCcw size={16} />
                Atualizar status
              </button>
              <button
                type="button"
                onClick={() => void syncEvolutionInstance('create')}
                disabled={
                  isStoreSaving ||
                  isEvolutionSyncing ||
                  isEvolutionRecovering ||
                  evolutionOverview?.exists === true
                }
                className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
              >
                {isEvolutionSyncing ? 'Sincronizando...' : 'Criar instancia'}
              </button>
              <button
                type="button"
                onClick={() => void syncEvolutionInstance('connect')}
                disabled={
                  isStoreSaving ||
                  isEvolutionSyncing ||
                  isEvolutionRecovering ||
                  evolutionOverview?.exists === false
                }
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isEvolutionSyncing ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <QrCode size={16} />
                )}
                Conectar / gerar QR
              </button>
              <button
                type="button"
                onClick={() => void recoverEvolutionInstance('restart')}
                disabled={
                  isStoreSaving ||
                  isEvolutionSyncing ||
                  isEvolutionRecovering ||
                  evolutionOverview?.exists === false
                }
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
              >
                {isEvolutionRecovering ? 'Processando...' : 'Reiniciar instancia'}
              </button>
              <button
                type="button"
                onClick={() => void recoverEvolutionInstance('logout')}
                disabled={
                  isStoreSaving ||
                  isEvolutionSyncing ||
                  isEvolutionRecovering ||
                  evolutionOverview?.exists === false
                }
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
              >
                {isEvolutionRecovering ? 'Processando...' : 'Deslogar sessao'}
              </button>
              <button
                type="button"
                onClick={() => void recoverEvolutionInstance('recreate')}
                disabled={isStoreSaving || isEvolutionSyncing || isEvolutionRecovering}
                className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {isEvolutionRecovering ? 'Processando...' : 'Recriar instancia'}
              </button>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={isStoreLoading || isStoreSaving}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isStoreSaving ? 'Salvando...' : 'Salvar configuracoes'}
          </button>
        </div>
      </form>

      {isQrModalOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
          onClick={closeQrModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={QR_MODAL_TITLE_ID}
            aria-describedby={QR_MODAL_DESCRIPTION_ID}
            className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-950">
              <div>
                <h3
                  id={QR_MODAL_TITLE_ID}
                  className="text-lg font-bold text-slate-900 dark:text-slate-100"
                >
                  Conectar WhatsApp da instancia
                </h3>
                <p
                  id={QR_MODAL_DESCRIPTION_ID}
                  className="mt-1 text-sm text-slate-500 dark:text-slate-400"
                >
                  Escaneie o QR Code abaixo com o WhatsApp Web do numero da loja.
                </p>
              </div>
              <button
                type="button"
                onClick={closeQrModal}
                className="rounded-xl p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div className="flex justify-center">
                {qrCodeImageUrl ? (
                  <img
                    src={qrCodeImageUrl}
                    alt="QR Code para conectar a instancia WhatsApp"
                    className="h-72 w-72 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700"
                  />
                ) : (
                  <div className="flex h-72 w-72 items-center justify-center rounded-2xl border border-dashed border-slate-300 px-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    O QR Code nao veio como imagem. Gere um novo QR para tentar novamente.
                  </div>
                )}
              </div>

              {pairingCode && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                  Codigo de pareamento: <span className="font-bold">{pairingCode}</span>
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                Se o QR expirar, clique em <strong>Conectar / gerar QR</strong>{' '}
                novamente. Depois de escanear, use <strong>Atualizar status</strong>{' '}
                para confirmar que a instancia ficou conectada.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={panelClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Logins de Funcionarios
          </h3>
          <button
            type="button"
            disabled={isLoading || isUserSaving}
            onClick={() => void handleRefresh()}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Atualizar lista
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Crie acessos extras para atendentes, tecnicos e financeiro.
        </p>
      </div>

      <form
        onSubmit={(event) => void handleCreateUser(event)}
        className={panelClass}
      >
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
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          />
          <input
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({ ...current, email: event.target.value }))
            }
            placeholder="E-mail"
            type="email"
            required
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
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
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          />
          <select
            value={form.perfil}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                perfil: event.target.value as UserProfile,
              }))
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
          disabled={isUserSaving}
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
                Acoes
              </th>
            </tr>
          </thead>
          <tbody>
            {!isLoading && sortedUsers.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="p-4 text-center text-sm text-slate-500 dark:text-slate-400"
                >
                  Nenhum usuario cadastrado.
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
                <td className="p-3.5 text-sm text-slate-600 dark:text-slate-300">
                  {user.email}
                </td>
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
                      disabled={isUserSaving || user.id === currentUser.id}
                      onClick={() => void toggleUserStatus(user)}
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      {user.ativo ? 'Desativar' : 'Reativar'}
                    </button>
                    <button
                      type="button"
                      disabled={isUserSaving || user.id === currentUser.id}
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
