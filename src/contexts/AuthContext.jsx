import { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext({});

// 🌟 CONFIGURAÇÃO INTELIGENTE DE URL:
// Se estiver rodando localmente (Vite expõe import.meta.env.DEV como true), usa o localhost.
// Se estiver rodando na Vercel (produção), usa uma string vazia '' para disparar rotas relativas.
const API_URL = import.meta.env.DEV ? 'http://localhost:3000' : '';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('@App:user');
      const storedToken = localStorage.getItem('@App:token');

      if (storedUser && storedToken) {
        return JSON.parse(storedUser);
      }
    } catch (error) {
      console.error("Erro ao ler dados do localStorage:", error);
      localStorage.removeItem('@App:user');
      localStorage.removeItem('@App:token');
    }

    return null;
  });
  const loading = false;

  useEffect(() => {
    function handleExpiredSession() {
      setUser(null);
    }

    window.addEventListener('auth:expired', handleExpiredSession);
    return () => window.removeEventListener('auth:expired', handleExpiredSession);
  }, []);

  // 🌟 FUNÇÃO DE LOGIN (URL RELATIVA EM PRODUÇÃO)
  const login = async (email, password, companySlug) => {
    // Em produção, isso vai virar exatamente: fetch('/api/auth/login')
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, companySlug }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao fazer login');
    }

    localStorage.setItem('@App:token', data.token);
    localStorage.setItem('@App:user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  // 🌟 FUNÇÃO DE CADASTRO (URL RELATIVA EM PRODUÇÃO)
  const register = async (userData) => {
    // Em produção, isso vai virar exatamente: fetch('/api/auth/register')
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao realizar o cadastro');
    }

    if (data.token && data.user) {
      localStorage.setItem('@App:token', data.token);
      localStorage.setItem('@App:user', JSON.stringify(data.user));
      setUser(data.user);
    }

    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('@App:token');
    localStorage.removeItem('@App:user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ signed: !!user, user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
