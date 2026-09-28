import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { appointmentService } from '../../../services/appointmentService.js';

// 🌟 IMPORTANTE: Importando o padrão CSS Modules para o componente interno
import styles from './CadastroCliente.module.css';

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

function CadastroCliente() {
  const { company } = useOutletContext();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  function handleChange(event) {
    const { name, value } = event.target;
    setForm(prev => ({ 
      ...prev, 
      // 🌟 MÁSCARA AUTOMÁTICA: Formata o número antes de persistir no estado
      [name]: name === 'telefone' ? formatarTelefone(value) : value 
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage({ type: '', text: '' });

    if (!form.nome || !form.telefone) {
      setMessage({ type: 'error', text: 'Nome e telefone são obrigatórios.' });
      return;
    }

    try {
      setLoading(true);

      await appointmentService.createCustomer({
        companyId: company._id,
        nome: form.nome,
        email: form.email,
        telefone: form.telefone
      });

      setMessage({
        type: 'success',
        text: 'Cliente cadastrado com sucesso! A senha inicial padrão é o telefone.'
      });

      setForm({ nome: '', email: '', telefone: '' });

    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error);
      const apiMessage = error.response?.data?.error || error.response?.data?.message;

      setMessage({
        type: 'error',
        text: apiMessage || 'Não foi possível cadastrar o cliente.'
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Novo cliente</h1>
        <p>Cadastre um cliente para {company?.name}.</p>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="nome">Nome completo</label>
            <input
              id="nome"
              name="nome"
              type="text"
              value={form.nome}
              onChange={handleChange}
              placeholder="Nome do cliente"
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="cliente@email.com"
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="telefone">Telefone</label>
            <input
              id="telefone"
              name="telefone"
              type="tel"
              value={form.telefone}
              onChange={handleChange}
              placeholder="(11) 99999-9999"
              className={styles.input}
            />
          </div>

          {message.text && (
            <div className={message.type === 'error' ? styles.error : styles.success}>
              {message.text}
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => navigate(-1)}
            >
              Voltar
            </button>

            <button type="submit" disabled={loading} className={styles.primary}>
              {loading ? 'Salvando...' : 'Cadastrar cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CadastroCliente;