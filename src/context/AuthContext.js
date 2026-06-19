import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { clearAuthSession, setAuthSession, setUnauthorizedHandler } from '../services/api';

const AUTH_STORAGE_KEY = 'authUser';

const AuthContext = createContext(null);

function getStoredUser() {
  const storedUser = sessionStorage.getItem(AUTH_STORAGE_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

function normalizeUser(userData, token) {
  if (!userData) {
    return null;
  }

  const resolvedToken = token || userData.token || null;
  const resolvedRole = userData.role || userData.userRole || null;
  const resolvedId = userData.id || userData.userId || userData.userID || null;

  return {
    ...userData,
    id: resolvedId,
    role: resolvedRole,
    token: resolvedToken,
  };
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => normalizeUser(getStoredUser()));

  const login = useCallback((token, userData) => {
    const nextUser = normalizeUser(userData, token);

    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  useEffect(() => {
    if (user) {
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      setAuthSession({
        token: user.token,
        userId: user.id,
        userRole: user.role,
        userName: [user.firstName, user.lastName].filter(Boolean).join(' ') || null,
      });
      return;
    }

    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    clearAuthSession();
    document.documentElement.setAttribute('data-theme', 'light');
  }, [user]);

  useEffect(() => {
    setUnauthorizedHandler(logout);

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [logout]);

  const value = {
    user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export { AuthContext, AuthProvider, useAuth };
export default AuthContext;