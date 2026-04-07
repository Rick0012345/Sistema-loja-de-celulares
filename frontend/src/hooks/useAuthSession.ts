import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { AuthStatus, AuthenticatedUser } from '../types';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Nao foi possivel concluir a operacao.';

type Credentials = {
  email: string;
  senha: string;
};

type BootstrapPayload = {
  nome: string;
  email: string;
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
  const onAuthenticatedRef = useRef(onAuthenticated);
  const onResetDataRef = useRef(onResetData);

  useEffect(() => {
    onAuthenticatedRef.current = onAuthenticated;
    onResetDataRef.current = onResetData;
  }, [onAuthenticated, onResetData]);

  const refreshAuthStatus = useCallback(async () => {
    const nextStatus = await api.getAuthStatus();
    setAuthStatus(nextStatus);
    return nextStatus;
  }, []);

  const logout = useCallback(
    async (message?: string) => {
      api.clearAuthToken();
      setSession(null);
      onResetDataRef.current();

      try {
        await refreshAuthStatus();
      } catch {
        setAuthStatus(null);
      }

      setErrorMessage(message ?? null);
    },
    [refreshAuthStatus],
  );

  const handleLogin = useCallback(
    async (payload: Credentials) => {
      setIsAuthenticating(true);
      setErrorMessage(null);

      try {
        const response = await api.login(payload);
        setSession(response.usuario);
        await refreshAuthStatus();
        await onAuthenticatedRef.current();
      } catch (error) {
        setErrorMessage(getErrorMessage(error));
      } finally {
        setIsAuthenticating(false);
      }
    },
    [refreshAuthStatus],
  );

  const handleBootstrap = useCallback(
    async (payload: BootstrapPayload) => {
      setIsAuthenticating(true);
      setErrorMessage(null);

      try {
        await api.bootstrapAdmin(payload);
        await refreshAuthStatus();
      } catch (error) {
        setErrorMessage(getErrorMessage(error));
      } finally {
        setIsAuthenticating(false);
      }
    },
    [refreshAuthStatus],
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
          await onAuthenticatedRef.current();
        } else {
          setSession(null);
          onResetDataRef.current();
        }

        if (!nextStatus.possuiUsuarios) {
          api.clearAuthToken();
          setSession(null);
        }
      } catch (error) {
        setErrorMessage(getErrorMessage(error));
        onResetDataRef.current();
      } finally {
        setIsCheckingAuth(false);
      }
    };

    void initialize();
  }, [refreshAuthStatus]);

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
