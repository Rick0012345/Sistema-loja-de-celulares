import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { AuthStatus, AuthenticatedUser } from '../types';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Nao foi possivel concluir a operacao.';

type Credentials = {
  email: string;
  senha: string;
};

type BootstrapPayload = Credentials & {
  nome: string;
};

type UseAuthSessionOptions = {
  onAuthenticated: () => Promise<void>;
  onResetData: () => void;
};

export const useAuthSession = ({
  onAuthenticated,
  onResetData,
}: UseAuthSessionOptions) => {
  const [session, setSession] = useState<AuthenticatedUser | null>(() => api.getStoredUser());
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshAuthStatus = useCallback(async () => {
    const nextStatus = await api.getAuthStatus();
    setAuthStatus(nextStatus);
    return nextStatus;
  }, []);

  const logout = useCallback(
    async (message?: string) => {
      api.clearAuthToken();
      setSession(null);
      onResetData();

      try {
        await refreshAuthStatus();
      } catch {
        setAuthStatus(null);
      }

      setErrorMessage(message ?? null);
    },
    [onResetData, refreshAuthStatus],
  );

  const handleLogin = useCallback(
    async (payload: Credentials) => {
      setIsAuthenticating(true);
      setErrorMessage(null);

      try {
        const response = await api.login(payload);
        setSession(response.usuario);
        await refreshAuthStatus();
        await onAuthenticated();
      } catch (error) {
        setErrorMessage(getErrorMessage(error));
      } finally {
        setIsAuthenticating(false);
      }
    },
    [onAuthenticated, refreshAuthStatus],
  );

  const handleBootstrap = useCallback(
    async (payload: BootstrapPayload) => {
      setIsAuthenticating(true);
      setErrorMessage(null);

      try {
        await api.bootstrapAdmin(payload);
        const response = await api.login({
          email: payload.email,
          senha: payload.senha,
        });
        setSession(response.usuario);
        await refreshAuthStatus();
        await onAuthenticated();
      } catch (error) {
        setErrorMessage(getErrorMessage(error));
      } finally {
        setIsAuthenticating(false);
      }
    },
    [onAuthenticated, refreshAuthStatus],
  );

  useEffect(() => {
    const initialize = async () => {
      setIsCheckingAuth(true);

      try {
        const nextStatus = await refreshAuthStatus();
        const token = api.getAuthToken();
        const storedUser = api.getStoredUser();

        if (token && storedUser) {
          setSession(storedUser);
          await onAuthenticated();
        } else {
          setSession(null);
          onResetData();
        }

        if (!nextStatus.possuiUsuarios) {
          api.clearAuthToken();
          setSession(null);
        }
      } catch (error) {
        setErrorMessage(getErrorMessage(error));
        onResetData();
      } finally {
        setIsCheckingAuth(false);
      }
    };

    void initialize();
  }, [onAuthenticated, onResetData, refreshAuthStatus]);

  return {
    session,
    authStatus,
    isCheckingAuth,
    isAuthenticating,
    errorMessage,
    setErrorMessage,
    login: handleLogin,
    bootstrap: handleBootstrap,
    logout,
  };
};
