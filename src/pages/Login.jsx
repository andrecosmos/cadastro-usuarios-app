import { useState } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// 🌟 IMPORTANTE: Importando o padrão CSS Modules do seu projeto
import styles from './Login.module.css';

export default function Login() {
  const { companySlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
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
      const loggedUser = await login(email, senha, companySlug);
      
      if (loggedUser?.role === 'admin') {
        navigate(`/${companySlug}/admin`);
      } else {
        // 🌟 ATUALIZADO: Se o usuário veio de uma tentativa de agendamento,
        // repassamos TODO o objeto contendo as seleções antigas de volta para a página inicial.
        navigate(`/${companySlug}`, {
          state: { 
            restoreBooking: location.state?.fromBooking === true, // Identificador de retorno
            ...location.state // Repassa selectedService, selectedStaff, etc.
          }
        });
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
        <h2 className={styles.title}>Entrar em {companySlug}</h2>

        {error && <div className={styles.error}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.group}>
            <label className={styles.label}>E-mail</label>
            <input
              type="email"
              required
              placeholder="seuemail@exemplo.com"
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
            {loading ? 'Carregando...' : 'Acessar Conta'}
          </button>
        </form>

        <Link
          to={`/${companySlug}/cadastro`}
          state={{ returnToBooking: location.state?.returnToBooking === true }}
          className={styles.backLink}
        >
          Ainda não tenho conta. Cadastre-se
        </Link>

        <a href={`/${companySlug}`} className={styles.backLink}>
          ← Voltar para agendamentos
        </a>
      </div>
    </div>
  );
}