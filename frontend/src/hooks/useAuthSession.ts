import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { AuthenticatedUser } from '../types';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Nao foi possivel concluir a operacao.';

type Credentials = {
  email: string;
  senha: string;
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
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const onAuthenticatedRef = useRef(onAuthenticated);
  const onResetDataRef = useRef(onResetData);

  useEffect(() => {
    onAuthenticatedRef.current = onAuthenticated;
    onResetDataRef.current = onResetData;
  }, [onAuthenticated, onResetData]);

  const logout = useCallback(
    async (message?: string) => {
      api.clearAuthToken();
      setSession(null);
      onResetDataRef.current();
      setErrorMessage(message ?? null);
    },
    [],
  );

  const handleLogin = useCallback(
    async (payload: Credentials) => {
      setIsAuthenticating(true);
      setErrorMessage(null);

      try {
        const response = await api.login(payload);
        setSession(response.usuario);
        await onAuthenticatedRef.current();
      } catch (error) {
        setErrorMessage(getErrorMessage(error));
      } finally {
        setIsAuthenticating(false);
      }
    },
    [],
  );

  useEffect(() => {
    const initialize = async () => {
      setIsCheckingAuth(true);

      try {
        const token = api.getAuthToken();

        if (token) {
          const currentUser = await api.getCurrentUser();
          setSession(currentUser);
          await onAuthenticatedRef.current();
        } else {
          setSession(null);
          onResetDataRef.current();
        }
      } catch (error) {
        setErrorMessage(getErrorMessage(error));
        onResetDataRef.current();
      } finally {
        setIsCheckingAuth(false);
      }
    };

    void initialize();
  }, []);

  return {
    session,
    isCheckingAuth,
    isAuthenticating,
    errorMessage,
    setErrorMessage,
    login: handleLogin,
    logout,
  };
};
