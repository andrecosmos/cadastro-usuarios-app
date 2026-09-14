import { useEffect, useState } from 'react';

import {
  useNavigate,
  useOutletContext
} from 'react-router-dom';

import {
  appointmentService
} from '../../../services/appointmentService.js';

import styles from './CadastroProfissional.module.css';

function CadastroProfissional() {

  const { company } = useOutletContext();

  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    specialties: []
  });

  const [services, setServices] = useState([]);

  const [loadingServices, setLoadingServices] =
    useState(true);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] = useState({
    type: '',
    text: ''
  });


  useEffect(() => {

    async function loadServices() {

      try {

        setLoadingServices(true);

        const response =
          await appointmentService.getServicesByCompany(
            company._id
          );

        setServices(response.services || []);

      } catch (error) {

        console.error(
          'Erro ao carregar serviços:',
          error
        );

        setMessage({
          type: 'error',
          text: 'Não foi possível carregar os serviços.'
        });

      } finally {

        setLoadingServices(false);

      }
    }

    if (company?._id) {
      loadServices();
    }

  }, [company]);


  function handleChange(event) {

    const { name, value } = event.target;

    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  }


  function handleSpecialtyChange(serviceId) {

    setForm(prev => {

      const alreadySelected =
        prev.specialties.includes(serviceId);

      if (alreadySelected) {

        return {
          ...prev,
          specialties:
            prev.specialties.filter(
              id => id !== serviceId
            )
        };

      }

      return {
        ...prev,
        specialties: [
          ...prev.specialties,
          serviceId
        ]
      };

    });
  }


  async function handleSubmit(event) {

    event.preventDefault();

    setMessage({
      type: '',
      text: ''
    });

    if (!form.name) {

      setMessage({
        type: 'error',
        text: 'Informe o nome do profissional.'
      });

      return;
    }

    try {

      setLoading(true);

      await appointmentService.createStaff({

        companyId: company._id,

        name: form.name,

        email: form.email,

        specialties: form.specialties

      });

      setMessage({
        type: 'success',
        text: 'Profissional cadastrado com sucesso!'
      });

      setForm({
        name: '',
        email: '',
        specialties: []
      });

    } catch (error) {

      console.error(
        'Erro ao cadastrar profissional:',
        error
      );

      setMessage({
        type: 'error',
        text:
          error.message ||
          'Não foi possível cadastrar o profissional.'
      });

    } finally {

      setLoading(false);

    }
  }


  return (
    <div className={styles.container}>

      <div className={styles.header}>

        <h1>Novo profissional</h1>

        <p>
          Cadastre um profissional de {company?.name}.
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
              placeholder="Nome do profissional"
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
              placeholder="profissional@email.com"
            />

          </div>


          <div className={styles.services}>

            <h2>Serviços realizados</h2>

            <p>
              Selecione os serviços que este profissional
              realiza.
            </p>


            {loadingServices ? (

              <div className={styles.loading}>
                Carregando serviços...
              </div>

            ) : services.length === 0 ? (

              <div className={styles.empty}>
                Nenhum serviço cadastrado para esta empresa.
              </div>

            ) : (

              <div className={styles.serviceList}>

                {services.map(service => (

                  <label
                    key={service._id}
                    className={styles.serviceItem}
                  >

                    <input
                      type="checkbox"
                      checked={form.specialties.includes(
                        service._id
                      )}
                      onChange={() =>
                        handleSpecialtyChange(
                          service._id
                        )
                      }
                    />

                    <span>
                      {service.name}
                    </span>

                  </label>

                ))}

              </div>

            )}

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
                : 'Cadastrar profissional'}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default CadastroProfissional;