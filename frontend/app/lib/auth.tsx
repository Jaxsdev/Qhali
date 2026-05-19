"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api, type UserPublic } from "./api";

interface AuthContextType {
  user: UserPublic | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserPublic>;
  register: (email: string, password: string) => Promise<UserPublic>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(true);

  // Al montar, verifica si hay token guardado y recupera el usuario
  useEffect(() => {
    const token = localStorage.getItem("qhali_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then(setUser)
      .catch(() => localStorage.removeItem("qhali_token"))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<UserPublic> => {
    const { access_token, user: u } = await api.login(email, password);
    localStorage.setItem("qhali_token", access_token);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (email: string, password: string): Promise<UserPublic> => {
    const { access_token, user: u } = await api.register(email, password);
    localStorage.setItem("qhali_token", access_token);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("qhali_token");
    setUser(null);
    // Llamada fire-and-forget al backend (opcional, token expirará solo)
    api.logout().catch(() => undefined);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
