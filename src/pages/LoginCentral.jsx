import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './Login.module.css'; // Reaproveita os mesmos estilos da sua outra tela de login!

export default function LoginCentral() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Como estamos na Landing Page, enviamos o companySlug como undefined.
      // O seu backend vai receber: { email, password, companySlug: undefined }
      const loggedUser = await login(email, senha, undefined);
      
      // Captura o slug retornado pelo banco de dados dentro do objeto do usuário
      const userSlug = loggedUser?.companySlug || loggedUser?.slug;

      if (!userSlug) {
        throw new Error('Não foi possível identificar o identificador da sua empresa.');
      }

      // Sendo o dono do negócio (admin), joga ele direto para o painel administrativo corporativo
      if (loggedUser?.role === 'admin') {
        navigate(`/${userSlug}/admin`);
      } else {
        // Se por acaso um cliente comum logar por aqui, joga ele para a página de agendamentos da empresa
        navigate(`/${userSlug}`);
      }
    } catch (err) {
      setError(err.message || 'E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Acessar Painel do Negócio</h2>
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
          Insira suas credenciais corporativas para gerenciar sua empresa.
        </p>

        {error && <div className={styles.error}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.group}>
            <label className={styles.label}>E-mail Corporativo</label>
            <input
              type="email"
              required
              placeholder="seuemail@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.group}>
            <label className={styles.label}>Senha</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className={styles.input}
            />
          </div>

          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? 'Carregando...' : 'Entrar no Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}
