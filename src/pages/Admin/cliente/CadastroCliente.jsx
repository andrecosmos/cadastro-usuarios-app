import { useState } from 'react';
import {
  useNavigate,
  useOutletContext
} from 'react-router-dom';

import { appointmentService } from '../../../services/appointmentService.js';

import styles from './CadastroCliente.module.css';

function CadastroCliente() {

  const { company } = useOutletContext();

  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState({
    type: '',
    text: ''
  });

  function handleChange(event) {

    const { name, value } = event.target;

    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  }

  async function handleSubmit(event) {

    event.preventDefault();

    setMessage({
      type: '',
      text: ''
    });

    if (!form.name || !form.phone) {

      setMessage({
        type: 'error',
        text: 'Nome e telefone são obrigatórios.'
      });

      return;
    }

    try {

      setLoading(true);

      await appointmentService.createCustomer({
        companyId: company._id,
        name: form.name,
        email: form.email,
        phone: form.phone
      });

      setMessage({
        type: 'success',
        text: 'Cliente cadastrado com sucesso!'
      });

      setForm({
        name: '',
        email: '',
        phone: ''
      });

    } catch (error) {

      console.error(
        'Erro ao cadastrar cliente:',
        error
      );

      setMessage({
        type: 'error',
        text:
          error.message ||
          'Não foi possível cadastrar o cliente.'
      });

    } finally {

      setLoading(false);

    }
  }

  return (
    <div className={styles.container}>

      <div className={styles.header}>

        <h1>Novo cliente</h1>

        <p>
          Cadastre um cliente para {company?.name}.
        </p>

      </div>


      <div className={styles.card}>

        <form onSubmit={handleSubmit}>

          <div className={styles.field}>

            <label htmlFor="name">
              Nome completo
            </label>

            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Nome do cliente"
            />

          </div>


          <div className={styles.field}>

            <label htmlFor="email">
              E-mail
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="cliente@email.com"
            />

          </div>


          <div className={styles.field}>

            <label htmlFor="phone">
              Telefone
            </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="(11) 99999-9999"
            />

          </div>


          {message.text && (
            <div
              className={
                message.type === 'error'
                  ? styles.error
                  : styles.success
              }
            >
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

            <button
              type="submit"
              className={styles.primary}
              disabled={loading}
            >
              {loading
                ? 'Salvando...'
                : 'Cadastrar cliente'}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default CadastroCliente;