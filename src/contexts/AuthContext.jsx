import { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('@App:user');
      const storedToken = localStorage.getItem('@App:token');

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Erro ao ler dados do localStorage:", error);
      localStorage.removeItem('@App:user');
      localStorage.removeItem('@App:token');
    } finally {
      setLoading(false); 
    }
  }, []);

  // 🌟 FUNÇÃO DE LOGIN ATUALIZADA (Envia o companySlug)
  const login = async (email, password, companySlug) => {
    const response = await fetch(`http://localhost:3000/api/auth/login`, {
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

  // 🌟 FUNÇÃO DE CADASTRO ATUALIZADA (Declarada corretamente para sumir o erro!)
  const register = async (userData) => {
    const response = await fetch(`http://localhost:3000/api/auth/register`, {
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
    /* 🌟 Incluindo 'register' aqui embaixo agora com a função existindo de verdade no código */
    <AuthContext.Provider value={{ signed: !!user, user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
