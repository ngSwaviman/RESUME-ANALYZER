import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { loginRequest, registerRequest, meRequest } from '../services/authService';
import { TOKEN_KEY, USER_KEY } from '../services/api';

export const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [initializing, setInitializing] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  const persistSession = (data) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    setProfile(data.profile || null);
  };

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    setProfile(null);
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await loginRequest(credentials);
    persistSession(data);
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await registerRequest(payload);
    // Recruiter sign-ups return no token: the account is pending admin approval.
    if (data.token) persistSession(data);
    return data;
  }, []);

  const refresh = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setInitializing(false);
      return null;
    }
    try {
      const data = await meRequest();
      setUser(data.user);
      setProfile(data.profile);
      return data;
    } catch (error) {
      logout();
      return null;
    } finally {
      setInitializing(false);
    }
  }, [logout]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const handleUnauthenticated = () => logout();
    window.addEventListener('ra:unauthenticated', handleUnauthenticated);
    return () => window.removeEventListener('ra:unauthenticated', handleUnauthenticated);
  }, [logout]);

  const value = useMemo(
    () => ({
      user,
      profile,
      token,
      initializing,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      logout,
      refresh,
      setProfile,
    }),
    [user, profile, token, initializing, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
