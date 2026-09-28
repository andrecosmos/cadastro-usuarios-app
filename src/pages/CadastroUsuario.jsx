import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { appointmentService } from '../services/appointmentService.js';

// 🌟 IMPORTANTE: Importando o padrão CSS Modules do seu projeto
import styles from './CadastroUsuario.module.css';

// Função auxiliar para aplicar a máscara: (XX) XXXXX-XXXX em tempo real
function formatarTelefone(value) {
  if (!value) return value;
  const apenasNumeros = value.replace(/\D/g, '');
  const celular = apenasNumeros.slice(0, 11);

  if (celular.length <= 2) {
    return celular.replace(/^(\d{0,2})/, '(\$1');
  }
  if (celular.length <= 6) {
    return celular.replace(/^(\d{2})(\d{0,4})/, '(\$1) \$2');
  }
  return celular.replace(/^(\d{2})(\d{4,5})(\d{4})/, '(\$1) \$2-\$3');
}

export default function CadastroUsuario() {
  const { companySlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();
  
  const [form, setForm] = useState({ nome: '', email: '', senha: '', telefone: '' });
  const [companyId, setCompanyId] = useState(null);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadCompanyData() {
      try {
        setLoadingCompany(true);
        const response = await appointmentService.getCompanyBySlug(companySlug);
        const idEncontrado = response?.company?._id || response?.data?.company?._id || response?.data?._id || response?._id;
        
        if (idEncontrado) {
          setCompanyId(idEncontrado);
        } else {
          setError('Não foi possível identificar este estabelecimento.');
        }
      } catch (err) {
        console.error('Erro ao buscar ID da empresa:', err);
        setError('Estabelecimento inválido ou fora do ar.');
      } finally {
        setLoadingCompany(false);
      }
    }

    if (companySlug) loadCompanyData();
  }, [companySlug]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ 
      ...previous, 
      // 🌟 APLICAÇÃO DA MÁSCARA: Intercepta o campo e formata antes de salvar no state
      [name]: name === 'telefone' ? formatarTelefone(value) : value 
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!companyId) {
      setError('Erro de segurança: ID do estabelecimento não carregado.');
      return;
    }

    setLoading(true);

    try {
      await register({
        companyId,
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        telefone: form.telefone || '' 
      });

      navigate(`/${companySlug}`, {
        state: { returnToBooking: location.state?.returnToBooking === true }
      });
    } catch (registrationError) {
      setError(registrationError.message || 'Não foi possível criar sua conta.');
    } finally {
      setLoading(false);
    }
  }

  if (loadingCompany) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <p className={styles.loadingText}>Identificando estabelecimento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Criar conta</h2>
        <p className={styles.subtitle}>Cadastre-se para agendar seu atendimento em {companySlug}.</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.group}>
            <label className={styles.label} htmlFor="nome">Nome completo</label>
            <input id="nome" name="nome" type="text" required value={form.nome} onChange={handleChange} className={styles.input} />
          </div>

          <div className={styles.group}>
            <label className={styles.label} htmlFor="email">E-mail</label>
            <input id="email" name="email" type="email" required value={form.email} onChange={handleChange} className={styles.input} />
          </div>

          <div className={styles.group}>
            <label className={styles.label} htmlFor="senha">Senha</label>
            <input id="senha" name="senha" type="password" required minLength="6" value={form.senha} onChange={handleChange} className={styles.input} />
          </div>

          <div className={styles.group}>
            <label className={styles.label} htmlFor="telefone">Telefone</label>
            <input id="telefone" name="telefone" type="tel" placeholder="(11) 99999-9999" value={form.telefone} onChange={handleChange} className={styles.input} />
          </div>

          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <Link to={`/${companySlug}/login`} state={{ returnToBooking: location.state?.returnToBooking === true }} className={styles.link}>
          Já tenho uma conta. Entrar
        </Link>
      </div>
    </div>
  );
}