// Adicione o "useNavigate" nas importações do react-router-dom
import { useParams, useNavigate, useLocation } from 'react-router-dom'; 
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { appointmentService } from './services/appointmentService';
import { FaWhatsapp } from 'react-icons/fa';
import { useAuth } from './contexts/AuthContext'; // Importando nosso contexto
import styles from './App.module.css';
import PerfilEstabelecimento from './pages/PerfilEstabelecimento'; 

export default function App() {
  const { companySlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signed, logout } = useAuth(); // Pegando dados do usuário logado
  
  const [company, setCompany] = useState(null);
  const [services, setServices] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [step, setStep] = useState(
    location.state?.returnToBooking && signed ? 'formulario' : 'perfil'
  );

  const [selectedService, setSelectedService] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  // 1. Adicione este estado junto com os seus outros estados (step, selectedService, etc.)
 const [selectedSlot, setSelectedSlot] = useState(null);
 // Guarda os dados do agendamento finalizado para exibir na tela de sucesso
const [confirmedData, setConfirmedData] = useState(null);
// Controla o estado de envio do agendamento para o backend
const [submittingBooking, setSubmittingBooking] = useState(false);



  function handleLogout() {
    logout();
    navigate(`/${companySlug}/login`);
  }

  function handleStartBooking() {
    if (!signed) {
      navigate(`/${companySlug}/login`, {
        state: { returnToBooking: true }
      });
      return;
    }

    setStep('formulario');
  }

  // 1. Carrega a Empresa pelo Slug
    // 1. Carrega a Empresa pelo Slug
  useEffect(() => {
    async function loadCompany() {
      try {
        setLoadingCompany(true);
        const response = await appointmentService.getCompanyBySlug(companySlug);
        
        const fetchedCompany = response?.company || response?.data?.company || response?.data || response;
        setCompany(fetchedCompany);

        // 🌟 ADICIONE ESTA LINHA DE LOG AQUI:
        console.log("🏢 DADOS DA EMPRESA QUE CHEGARAM NO FRONT:", fetchedCompany);

      } catch (err) {
        setError(err.message || 'Estabelecimento não encontrado.');
      } finally {
        setLoadingCompany(false);
      }
    }
    if (companySlug) loadCompany();
  }, [companySlug]);


  // 🌟 ADICIONADO: BLOQUEIO E LOGOUT EM TEMPO REAL PARA AGENDAMENTO PÚBLICO (MULTITENANCY)
  // Se o cliente estiver logado na Empresa A mas acessar a URL da Empresa B, ele é deslogado silenciosamente
  useEffect(() => {
    if (signed && user?.companyId && company?._id) {
      if (user.companyId !== company._id) {
        console.warn("Sessão inválida para esta empresa. Desconectando usuário antigo.");
        logout(); // Limpa o estado global e o localStorage do usuário da outra empresa
        
        // Mantém ele na página atual, mas agora deslogado de forma limpa para poder interagir
        setStep('perfil'); 
      }
    }
  }, [company, signed, user, logout]);

  // 2. Carrega Serviços e Profissionais
  useEffect(() => {
    async function loadCompanyData() {
      if (!company?._id) return;
      try {
        const [servicesRes, staffRes] = await Promise.all([
          appointmentService.getServicesByCompany(company._id),
          appointmentService.getStaffByCompany(company._id)
        ]);
        setServices(servicesRes.services);
        setStaffList(staffRes.staff);
      } catch (err) {
        setError('Erro ao carregar dados do estabelecimento.');
      }
    }
    loadCompanyData();
  }, [company]);

  // 3. Busca horários livres dinamicamente
  useEffect(() => {
    async function loadSlots() {
      if (!company?._id || !selectedStaff || !selectedService || !selectedDate) {
        setAvailableSlots([]);
        return;
      }
      
      setLoadingSlots(true);
      setError('');
      setSuccessMessage('');
      try {
        const response = await appointmentService.getAvailableSlots(
          company._id,
          selectedStaff,
          selectedService,
          selectedDate
        );
        setAvailableSlots(response.availableSlots);
      } catch (err) {
        setError(err.message || 'Erro ao carregar horários.');
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    loadSlots();
  }, [selectedDate, selectedStaff, selectedService, company]);

     async function handleBookAppointment(dateTimeIso) {
    if (!signed) {
      // 🌟 ATUALIZADO: Salva o estado atual usando a chave 'returnToBooking' que seu login já escuta
      navigate(`/${companySlug}/login`, { 
        state: { 
          returnToBooking: true,
          selectedService,
          selectedStaff,
          selectedDate,
          selectedSlot: dateTimeIso
        } 
      });
      return;
    }

    if (user?.companyId && company?._id && user.companyId !== company._id) {
      alert(`Sua conta está vinculada a outro estabelecimento. Por favor, faça login com uma conta válida.`);
      logout();
      navigate(`/${companySlug}/login`);
      return;
    }

    setError('');
    setSubmittingBooking(true);

    try {
      const response = await appointmentService.createAppointment({
        companyId: company._id,
        customerId: user._id, 
        professionalId: selectedStaff,
        serviceId: selectedService,
        startTime: dateTimeIso,
      });

      const dadosDoAgendamento = {
        servico: services.find(s => s._id === selectedService)?.name || 'Serviço Selecionado',
        profissional: staffList.find(st => st._id === selectedStaff)?.name || 'Profissional Selecionado',
        data: selectedDate,
        horario: format(new Date(dateTimeIso), 'HH:mm'),
        duracao: services.find(s => s._id === selectedService)?.durationInMinutes || 30
      };

      setConfirmedData(dadosDoAgendamento);
      setStep('sucesso');
      setSuccessMessage(response.message);
      setAvailableSlots((prev) => prev.filter((slot) => slot.dateTimeIso !== dateTimeIso));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingBooking(false);
    }
  }

  // 🌟 NOVO EFFECT: Escuta o retorno do login e reconstrói o formulário na hora
  useEffect(() => {
    // Se o state contiver o sinalizador de retorno e dados válidos de serviço:
    if (location.state?.returnToBooking && location.state?.selectedService) {
      console.log("🔄 Restaurando dados selecionados pós-login:", location.state);
      
      // Reinjeta os dados clicados de volta nos estados locais do React
      setSelectedService(location.state.selectedService);
      
      if (location.state.selectedStaff) setSelectedStaff(location.state.selectedStaff);
      if (location.state.selectedDate) setSelectedDate(location.state.selectedDate);
      if (location.state.selectedSlot) setSelectedSlot(location.state.selectedSlot);

      // Manda o usuário logado direto para a Tela do Formulário preenchida
      setStep('formulario');
      
      // Limpa os dados do histórico da URL para o efeito não rodar de novo em F5 acidentais
      window.history.replaceState({}, document.title);
    }
  }, [location]);


  

  const dateFormatted = format(new Date(selectedDate + 'T12:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR });

  if (loadingCompany) {
    return <div className={styles.loadingScreen}>Identificando estabelecimento...</div>;
  }

  if (error && !company) {
    return <div className={styles.errorScreen}>⚠️ {error}</div>;
  }
  

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.sessionHeader}>
        <strong>{company?.name || 'Agendamentos'}</strong>

       {signed && (
        <div className={styles.sessionActions}>
          <span className={styles.sessionUser}>
            {user?.name || user?.email}
          </span>
          
          {/* 🌟 ATUALIZADO: Agora aponta para a rota global limpa */}
          <button 
            type="button" 
            className={styles.historyNavButton}
            onClick={() => navigate(`/${companySlug}/minha-conta`)}
          >
            📅 Minha Conta
          </button>
          
          <button type="button" className={styles.logoutButton} onClick={handleLogout}>
            Sair
          </button>
        </div>
      )}

      </header>
      
      {/* TELA 1: PERFIL */}
      {/* 🌟 TELA 1: PERFIL DO ESTABELECIMENTO (NOVO COMPONENTE) */}
      {step === 'perfil' && (
        <PerfilEstabelecimento 
          company={company}
          services={services}
          onSelectService={(serviceId) => {
            // Guarda o serviço clicado direto do card
            setSelectedService(serviceId);
            // Avança o usuário instantaneamente para o formulário de horários!
            setStep('formulario'); 
          }}
        />
      )}
      

            {/* TELA 2: FORMULÁRIO COM CARDS INTERATIVOS */}
      {step === 'formulario' && (
        <div className={styles.cardContainer}>
          <div className={styles.formHeader}>
            <button onClick={() => setStep('perfil')} className={styles.btnBack}>⬅️</button>
            <div>
              <h1>{company?.name}</h1>
              <p>Monte o seu atendimento</p>
            </div>
          </div>

          <div className={styles.formBody}>
            {error && <div className={styles.alertError}>⚠️ {error}</div>}
            {successMessage && <div className={styles.alertSuccess}>✅ {successMessage}</div>}

            {/* 1. SELEÇÃO DE SERVIÇO EM CARDS */}
            <div className={styles.inputField}>
              <label className={styles.fieldLabel}>1. Selecione o Serviço:</label>
              <div className={styles.servicesGridList}>
                {services.map(s => {
                  const isSelected = selectedService === s._id;
                  return (
                    <div 
                      key={s._id}
                      className={`${styles.serviceSelectCard} ${isSelected ? styles.cardActive : ''}`}
                      onClick={() => {
                        setSelectedService(s._id);
                        setSelectedSlot(null); // Limpa o horário se mudar o serviço
                        setAvailableSlots([]);
                      }}
                    >
                      <div className={styles.serviceInfoLeft}>
                        <h3>{s.name}</h3>
                        <span>⏱️ {s.durationInMinutes} min</span>
                      </div>
                      <div className={styles.servicePriceRight}>
                        <strong>R\$ {s.price.toFixed(2)}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. SELEÇÃO DE PROFISSIONAL EM CARDS */}
            <div className={styles.inputField}>
              <label className={styles.fieldLabel}>2. Selecione o Profissional:</label>
              <div className={styles.staffGridList}>
                {staffList.map(st => {
                  const isSelected = selectedStaff === st._id;
                  return (
                    <div
                      key={st._id}
                      className={`${styles.staffSelectCard} ${isSelected ? styles.cardActive : ''}`}
                      onClick={() => {
                        setSelectedStaff(st._id);
                        setSelectedSlot(null); // Limpa o horário se mudar o profissional
                        setAvailableSlots([]);
                      }}
                    >
                      <div className={styles.staffAvatar}>
                        {st.name.charAt(0).toUpperCase()}
                      </div>
                      <h3>{st.name}</h3>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. SELEÇÃO DO DIA (Mantemos o input date padrão por ser nativo e excelente no mobile) */}
            <div className={styles.inputField}>
              <label className={styles.fieldLabel}>3. Selecione o Dia:</label>
              <input
                type="date"
                className={styles.modernDateInput}
                value={selectedDate}
                min={format(new Date(), 'yyyy-MM-dd')}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot(null); // Limpa o horário se mudar a data
                }}
              />
            </div>

            {/* GRADE DE HORÁRIOS */}
            <div className={styles.slotsDivider}>
              <h2 className={styles.slotsTitle}>Horários para {dateFormatted}:</h2>
              
              {!selectedService || !selectedStaff ? (
                <div className={styles.slotsEmptyState}>Selecione o serviço e o profissional acima para liberar os horários.</div>
              ) : loadingSlots ? (
                <div className={styles.slotsLoading}>Carregando horários vagos...</div>
              ) : availableSlots.length === 0 ? (
                <div className={styles.slotsEmptyState}>Não há horários disponíveis para esta data.</div>
              ) : (
                <div className={styles.slotsGrid}>
                  {availableSlots.map((slot) => {
                    const isSelected = selectedSlot === slot.dateTimeIso;
                    return (
                      <button
                        key={slot.dateTimeIso}
                        type="button"
                        onClick={() => setSelectedSlot(slot.dateTimeIso)}
                        className={`${styles.btnSlot} ${isSelected ? styles.btnSlotSelected : ''}`}
                      >
                        {slot.time || format(new Date(slot.dateTimeIso), 'HH:mm')}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

                        {/* BOTÃO DE CONFIRMAÇÃO FIXO COM FEEDBACK DE LOADING */}
            {selectedSlot && (
              <div className={styles.confirmationActionContainer}>
                <button
                  type="button"
                  className={`${styles.btnConfirmAppointment} ${submittingBooking ? styles.btnConfirmLoading : ''}`}
                  onClick={() => handleBookAppointment(selectedSlot)}
                  disabled={submittingBooking} // 🌟 Impede o clique duplo enquanto envia
                >
                  {submittingBooking ? (
                    <div className={styles.loadingFlex}>
                      <span className={styles.spinner}></span>
                      <span>Reservando seu horário...</span>
                    </div>
                  ) : (
                    '🚀 Confirmar meu Agendamento'
                  )}
                </button>
              </div>
            )}

          </div>
        </div>
      )}


            {/* TELA 3: AGENDAMENTO CONFIRMADO */}
      {step === 'sucesso' && confirmedData && (
        <div className={styles.successContainer}>
          <div className={styles.successCard}>
            {/* Ícone de sucesso animado */}
            <div className={styles.successIconWrapper}>
              <div className={styles.successCheckmark}>✓</div>
            </div>

            <span className={styles.successBadge}>TUDO CERTO!</span>
            <h1>Agendamento Confirmado!</h1>
            <p className={styles.successSubtitle}>
              Seu horário foi reservado com sucesso no estabelecimento <strong>{company?.name}</strong>.
            </p>

            {/* Bilhete/Resumo com os detalhes do agendamento */}
            <div className={styles.ticketContainer}>
              <div className={styles.ticketRow}>
                <span>Serviço:</span>
                <strong>{confirmedData.servico}</strong>
              </div>
              <div className={styles.ticketRow}>
                <span>Profissional:</span>
                <strong>{confirmedData.profissional}</strong>
              </div>
              <div className={styles.ticketRow}>
                <span>Data:</span>
                <strong>{format(new Date(confirmedData.data + 'T00:00:00'), 'dd/MM/yyyy')}</strong>
              </div>
              <div className={styles.ticketRow}>
                <span>Horário:</span>
                <strong>{confirmedData.horario} h</strong>
              </div>
              <div className={styles.ticketRow}>
                <span>Duração:</span>
                <span>{confirmedData.duracao} minutos</span>
              </div>
            </div>

            {/* Bloco de avisos importantes (Gera segurança psicológica) */}
            <div className={styles.reminderBox}>
              💡 <strong>Lembrete:</strong> Enviamos uma confirmação para o seu WhatsApp. Caso precise cancelar ou reagendar, faça com pelo menos 2 horas de antecedência.
            </div>

            {/* Ações Finais */}
            <div className={styles.successActionsGrid}>
              <a
                href={`https://google.com{encodeURIComponent(confirmedData.servico + ' - ' + company?.name)}&dates=${confirmedData.data.replace(/-/g, '')}T${confirmedData.horario.replace(/:/g, '')}00Z/${confirmedData.data.replace(/-/g, '')}T${confirmedData.horario.replace(/:/g, '')}00Z&details=${encodeURIComponent('Agendamento realizado pelo sistema Agenda.')}`}
                target="_blank"
                rel="noreferrer"
                className={styles.btnCalendar}
              >
                📅 Adicionar ao Google Agenda
              </a>

              <button
                type="button"
                className={styles.btnRestart}
                onClick={() => {
                  // Limpa todos os estados para permitir um novo agendamento limpo se o usuário quiser
                  setSelectedService('');
                  setSelectedStaff('');
                  setSelectedSlot(null);
                  setConfirmedData(null);
                  setStep('perfil');
                }}
              >
                Voltar para o Início
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
