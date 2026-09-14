import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentService } from '../../../services/appointmentService.js';
import styles from './CadastroEmpresa.module.css';

function CadastroEmpresa() {

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

    if (!form.name || !form.email || !form.phone) {

      setMessage({
        type: 'error',
        text: 'Preencha todos os campos obrigatórios.'
      });

      return;
    }

    try {

      setLoading(true);

      const response =
        await appointmentService.createCompany(form);

      setMessage({
        type: 'success',
        text: `Empresa "${response.data.name}" criada com sucesso!`
      });

      setForm({
        name: '',
        email: '',
        phone: ''
      });

    } catch (error) {

      console.error(
        'Erro ao cadastrar empresa:',
        error
      );

      setMessage({
        type: 'error',
        text:
          error.message ||
          'Não foi possível cadastrar a empresa.'
      });

    } finally {

      setLoading(false);

    }
  }

  return (
    <div className={styles.container}>

      <div className={styles.header}>

        <div>
          <h1>Nova empresa</h1>

          <p>
            Cadastre um novo estabelecimento na plataforma.
          </p>
        </div>

      </div>


      <div className={styles.card}>

        <form onSubmit={handleSubmit}>

          <div className={styles.formGrid}>

            <div className={styles.field}>
              <label htmlFor="name">
                Nome da empresa
              </label>

              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Ex.: Studio Bella"
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
                placeholder="contato@empresa.com"
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
                ? 'Cadastrando...'
                : 'Cadastrar empresa'}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default CadastroEmpresa;