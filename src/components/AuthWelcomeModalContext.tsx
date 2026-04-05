"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const AUTH_WELCOME_DISMISSED_KEY = "casebs_welcome_auth_dismissed";

type AuthWelcomeModalContextValue = {
  openAuthWelcomeModal: () => void;
  reopenNonce: number;
};

const AuthWelcomeModalContext =
  createContext<AuthWelcomeModalContextValue | null>(null);

export function AuthWelcomeModalProvider({ children }: { children: ReactNode }) {
  const [reopenNonce, setReopenNonce] = useState(0);
  const openAuthWelcomeModal = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_WELCOME_DISMISSED_KEY);
    } catch {
      /* ignore */
    }
    setReopenNonce((n) => n + 1);
  }, []);

  const value = useMemo(
    () => ({ openAuthWelcomeModal, reopenNonce }),
    [openAuthWelcomeModal, reopenNonce],
  );

  return (
    <AuthWelcomeModalContext.Provider value={value}>
      {children}
    </AuthWelcomeModalContext.Provider>
  );
}

export function useAuthWelcomeModalControl() {
  const ctx = useContext(AuthWelcomeModalContext);
  if (!ctx) {
    throw new Error(
      "useAuthWelcomeModalControl must be used within AuthWelcomeModalProvider",
    );
  }
  return ctx;
}
