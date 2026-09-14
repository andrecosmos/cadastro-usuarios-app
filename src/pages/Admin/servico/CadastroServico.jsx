import { useState } from 'react';
import {
  useNavigate,
  useOutletContext
} from 'react-router-dom';

import { appointmentService } from '../../../services/appointmentService.js';

import styles from './CadastroServico.module.css';

function CadastroServico() {

  const { company } = useOutletContext();

  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    description: '',
    durationInMinutes: 30,
    price: 0
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
      [name]: name === 'durationInMinutes' ? parseInt(value, 10) : name === 'price' ? parseFloat(value) : value
    }));
  }

  async function handleSubmit(event) {

    event.preventDefault();

    setMessage({
      type: '',
      text: ''
    });

    if (!form.name || !form.durationInMinutes) {

      setMessage({
        type: 'error',
        text: 'Nome e duração são obrigatórios.'
      });

      return;
    }

    try {

      setLoading(true);

      await appointmentService.createService({
        companyId: company._id,
        name: form.name,
        description: form.description,
        durationInMinutes: parseInt(form.durationInMinutes, 10),
        price: parseFloat(form.price),
        isActive: true
      });

      setMessage({
        type: 'success',
        text: 'Serviço cadastrado com sucesso!'
      });

      setForm({
        name: '',
        description: '',
        durationInMinutes: 30,
        price: 0
      });

    } catch (error) {

      console.error(
        'Erro ao cadastrar serviço:',
        error
      );

      setMessage({
        type: 'error',
        text:
          error.message ||
          'Não foi possível cadastrar o serviço.'
      });

    } finally {

      setLoading(false);

    }
  }

  return (
    <div className={styles.container}>

      <div className={styles.header}>

        <h1>Novo serviço</h1>

        <p>
          Cadastre um novo serviço para {company?.name}.
        </p>

      </div>


      <div className={styles.card}>

        <form onSubmit={handleSubmit}>

          <div className={styles.field}>

            <label htmlFor="name">
              Nome do serviço
            </label>

            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Ex.: Corte de cabelo"
            />

          </div>


          <div className={styles.field}>

            <label htmlFor="description">
              Descrição
            </label>

            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Descreva o serviço (opcional)"
              rows="4"
            />

          </div>


          <div className={styles.field}>

            <label htmlFor="durationInMinutes">
              Duração (em minutos)
            </label>

            <input
              id="durationInMinutes"
              name="durationInMinutes"
              type="number"
              min="15"
              step="15"
              value={form.durationInMinutes}
              onChange={handleChange}
              placeholder="30"
            />

          </div>

            <div className={styles.field}>

              <label htmlFor="price">
                Preço
              </label>

              <input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                placeholder="0.00"
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
                ? 'Cadastrando...'
                : 'Cadastrar serviço'}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default CadastroServico;
