import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { format } from 'date-fns';
import { FaWhatsapp } from 'react-icons/fa';

import { appointmentService } from '../../../services/appointmentService.js';
import { gerarLinkWhatsApp } from '../../../hooks/whatsappHelper.js';
import styles from './CriarAgendamento.module.css';

export default function CriarAgendamento() {
  const { company } = useOutletContext();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedService, setSelectedService] = useState('');
  const [selectedProfessional, setSelectedProfessional] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlot, setSelectedSlot] = useState('');
  const [customerQuery, setCustomerQuery] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [createdBooking, setCreatedBooking] = useState(null);

  useEffect(() => {
    if (!company?._id) return undefined;
    let active = true;

    async function loadBookingOptions() {
      try {
        setLoadingOptions(true);
        const [serviceResponse, professionalResponse] = await Promise.all([
          appointmentService.getServicesByCompany(company._id),
          appointmentService.getStaffByCompany(company._id)
        ]);
        if (!active) return;
        setServices(serviceResponse.services || []);
        setProfessionals(professionalResponse.staff || []);
      } catch (requestError) {
        if (active) {
          setError(requestError.message || 'Não foi possível carregar serviços e profissionais.');
        }
      } finally {
        if (active) setLoadingOptions(false);
      }
    }

    loadBookingOptions();
    return () => {
      active = false;
    };
  }, [company]);

  useEffect(() => {
    if (!company?._id) return undefined;
    let active = true;
    const timeout = window.setTimeout(async () => {
      try {
        setLoadingCustomers(true);
        const response = await appointmentService.searchCustomers(company._id, customerQuery);
        if (active) setCustomers(response.customers || []);
      } catch (requestError) {
        if (active) {
          setCustomers([]);
          setError(requestError.message || 'Não foi possível buscar os clientes.');
        }
      } finally {
        if (active) setLoadingCustomers(false);
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [company, customerQuery]); 

  useEffect(() => {
    if (!company?._id || !selectedProfessional || !selectedService || !selectedDate) {
      return undefined;
    }

    let active = true;
    async function loadSlots() {
      try {
        setLoadingSlots(true);
        const response = await appointmentService.getAvailableSlots(
          company._id,
          selectedProfessional,
          selectedService,
          selectedDate
        );
        if (active) {
          setAvailableSlots(response.availableSlots || []);
          setError('');
        }
      } catch (requestError) {
        if (active) {
          setAvailableSlots([]);
          setError(requestError.message || 'Não foi possível carregar os horários.');
        }
      } finally {
        if (active) setLoadingSlots(false);
      }
    }

    loadSlots();
    return () => {
      active = false;
    };
  }, [company, selectedDate, selectedProfessional, selectedService]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!selectedCustomer || !selectedService || !selectedProfessional || !selectedSlot) {
      setError('Selecione cliente, serviço, profissional, data e horário.');
      return;
    }

    try {
      setSubmitting(true);
      await appointmentService.createAppointment({
        companyId: company._id,
        customerId: selectedCustomer._id,
        serviceId: selectedService,
        professionalId: selectedProfessional,
        startTime: selectedSlot
      });
      const selectedSlotDetails = availableSlots.find((slot) => slot.dateTimeIso === selectedSlot);
      setCreatedBooking({
        servico: selectedServiceDetails?.name || 'Serviço',
        profissional: selectedProfessionalDetails?.name || 'Profissional',
        data: selectedDate,
        horario: selectedSlotDetails?.time || '',
        telefoneCliente: selectedCustomer.telefone || '',
        nomeCliente: selectedCustomer.nome
      });
      setNotice('Agendamento criado com sucesso.');
      setSelectedSlot('');
      setSelectedCustomer(null);
      setCustomerQuery('');
      setSelectedService('');
      setSelectedProfessional('');
      setAvailableSlots([]);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
        requestError.message ||
        'Não foi possível criar o agendamento.'
      );
      if (requestError.response?.status === 409) {
        setAvailableSlots((slots) => slots.filter((slot) => slot.dateTimeIso !== selectedSlot));
        setSelectedSlot('');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const selectedServiceDetails = services.find((service) => service._id === selectedService);
  const selectedProfessionalDetails = professionals.find(
    (professional) => professional._id === selectedProfessional
  );
  const today = format(new Date(), 'yyyy-MM-dd');
  const whatsappUrl = createdBooking
    ? gerarLinkWhatsApp(createdBooking, company, 'admin')
    : '';

  if (!company) {
    return <div className={styles.container}>Carregando empresa...</div>;
  }


  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Novo agendamento</h1>
        <p>Agende um horário para um cliente de {company.name}.</p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <section className={styles.card}>
          <h2>1. Cliente</h2>
          {selectedCustomer ? (
            <div className={styles.selectedCustomer}>
              <div>
                <strong>{selectedCustomer.nome}</strong>
                <span>{selectedCustomer.telefone || selectedCustomer.email}</span>
              </div>
              <button
                type="button"
                className={styles.textButton}
                onClick={() => {
                  setSelectedCustomer(null);
                  setCustomerQuery('');
                }}
              >
                Trocar cliente
              </button>
            </div>
          ) : (
            <>
              <label className={styles.label} htmlFor="customer-search">
                Buscar por nome, telefone ou e-mail
              </label>
              <input
                id="customer-search"
                className={styles.input}
                type="search"
                value={customerQuery}
                onChange={(event) => setCustomerQuery(event.target.value)}
                placeholder="Digite o nome ou telefone do cliente"
                autoComplete="off"
              />
              <div className={styles.customerResults} aria-live="polite">
                {loadingCustomers ? (
                  <p className={styles.helper}>Buscando clientes...</p>
                ) : customers.length > 0 ? (
                  customers.map((customer) => (
                    <button
                      type="button"
                      key={customer._id}
                      className={styles.customerOption}
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setCreatedBooking(null);
                      }}
                    >
                      <strong>{customer.nome}</strong>
                      <span>{customer.telefone || customer.email}</span>
                    </button>
                  ))
                ) : (
                  <p className={styles.helper}>
                    {customerQuery.length === 1
                      ? 'Digite mais caracteres para buscar.'
                      : 'Nenhum cliente encontrado. Cadastre o cliente antes de agendar.'}
                  </p>
                )}
              </div>
            </>
          )}
        </section>

        <section className={styles.card}>
          <h2>2. Serviço e profissional</h2>
          {loadingOptions ? (
            <p className={styles.helper}>Carregando serviços e profissionais...</p>
          ) : (
            <div className={styles.fields}>
              <div>
                <label className={styles.label} htmlFor="appointment-service">Serviço</label>
                <select
                  id="appointment-service"
                  className={styles.input}
                  value={selectedService}
                  onChange={(event) => {
                    setSelectedService(event.target.value);
                    setCreatedBooking(null);
                    setSelectedSlot('');
                    setAvailableSlots([]);
                    setError('');
                    setNotice('');
                  }}
                  required
                >
                  <option value="">Selecione um serviço</option>
                  {services.map((service) => (
                    <option key={service._id} value={service._id}>
                      {service.name} ({service.durationInMinutes} min)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={styles.label} htmlFor="appointment-professional">Profissional</label>
                <select
                  id="appointment-professional"
                  className={styles.input}
                  value={selectedProfessional}
                  onChange={(event) => {
                    setSelectedProfessional(event.target.value);
                    setCreatedBooking(null);
                    setSelectedSlot('');
                    setAvailableSlots([]);
                    setError('');
                    setNotice('');
                  }}
                  required
                >
                  <option value="">Selecione um profissional</option>
                  {professionals.map((professional) => (
                    <option key={professional._id} value={professional._id}>
                      {professional.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          {!loadingOptions && services.length === 0 && (
            <p className={styles.helper}>Cadastre um serviço para iniciar o agendamento.</p>
          )}
        </section>

        <section className={styles.card}>
          <h2>3. Data e horário</h2>
          <div className={styles.dateField}>
            <label className={styles.label} htmlFor="appointment-date">Data</label>
            <input
              id="appointment-date"
              className={styles.input}
              type="date"
              value={selectedDate}
              min={today}
              onChange={(event) => {
                setSelectedDate(event.target.value);
                setCreatedBooking(null);
                setSelectedSlot('');
                setAvailableSlots([]);
                setError('');
                setNotice('');
              }}
              required
            />
          </div>
          {!selectedService || !selectedProfessional ? (
            <p className={styles.helper}>Selecione o serviço e o profissional para ver os horários.</p>
          ) : loadingSlots ? (
            <p className={styles.helper}>Carregando horários disponíveis...</p>
          ) : availableSlots.length > 0 ? (
            <div className={styles.slotGrid} role="group" aria-label="Horários disponíveis">
              {availableSlots.map((slot) => (
                <button
                  type="button"
                  key={slot.dateTimeIso}
                  className={`${styles.slot} ${selectedSlot === slot.dateTimeIso ? styles.slotSelected : ''}`}
                  aria-pressed={selectedSlot === slot.dateTimeIso}
                  onClick={() => setSelectedSlot(slot.dateTimeIso)}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          ) : (
            <p className={styles.helper}>Não há horários disponíveis nesta data.</p>
          )}
        </section>

        {error && <p className={styles.error} role="alert">{error}</p>}
        {notice && <p className={styles.success} role="status">{notice}</p>}

        {createdBooking && (
          <section className={styles.whatsappConfirmation} aria-live="polite">
            <div>
              <h2>Confirme com o cliente</h2>
              <p>
                Abra o WhatsApp com os dados do agendamento preenchidos. Revise a mensagem e toque em
                enviar no WhatsApp.
              </p>
            </div>
            {whatsappUrl ? (
              <a
                className={styles.whatsappButton}
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaWhatsapp aria-hidden="true" />
                Abrir WhatsApp e enviar confirmação
              </a>
            ) : (
              <p className={styles.helper}>
                Este cliente não tem um telefone válido cadastrado para abrir o WhatsApp.
              </p>
            )}
          </section>
        )}

        {selectedCustomer && selectedServiceDetails && selectedProfessionalDetails && selectedSlot && (
          <section className={styles.summary}>
            <h2>Resumo</h2>
            <p><strong>Cliente:</strong> {selectedCustomer.nome}</p>
            <p><strong>Serviço:</strong> {selectedServiceDetails.name}</p>
            <p><strong>Profissional:</strong> {selectedProfessionalDetails.name}</p>
            <p><strong>Data e horário:</strong> {selectedDate} às {availableSlots.find((slot) => slot.dateTimeIso === selectedSlot)?.time}</p>
          </section>
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
            disabled={submitting || loadingOptions || !selectedCustomer || !selectedService || !selectedProfessional || !selectedSlot}
          >
            {submitting ? 'Criando agendamento...' : 'Confirmar agendamento'}
          </button>
        </div>
      </form>

      
    </div>
  );
}
