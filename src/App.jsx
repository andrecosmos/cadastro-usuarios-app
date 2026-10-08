// Adicione o "useNavigate" nas importações do react-router-dom
import { useParams, useNavigate, useLocation } from 'react-router-dom'; 
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatBusinessTime } from '../shared/dateTime.js';
import { appointmentService } from './services/appointmentService';
import { FaWhatsapp } from 'react-icons/fa';
import { useAuth } from './contexts/AuthContext'; // Importando nosso contexto
import styles from './App.module.css';
import PerfilEstabelecimento from './pages/PerfilEstabelecimento'; 
import { gerarLinkWhatsApp } from './hooks/whatsappHelper'; // Importando a função do helper

const checkoutReturnMessages = {
  success: 'Retorno recebido. O Mercado Pago está validando o pagamento; consulte Minha Conta para acompanhar a confirmação.',
  pending: 'O pagamento está pendente. O agendamento só será confirmado após a validação do Mercado Pago.',
  failure: 'O checkout foi encerrado sem confirmação. A reserva temporária será liberada após o prazo de pagamento.'
};

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

  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
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
const checkoutReturnMessage = checkoutReturnMessages[
  new URLSearchParams(location.search).get('checkout_return')
] || '';
const selectedServiceDetails = services.filter((service) =>
  selectedServiceIds.includes(service._id)
);
const selectedServiceDuration = selectedServiceDetails.reduce(
  (total, service) => total + Number(service.durationInMinutes || 0),
  0
);
const selectedServiceTotal = selectedServiceDetails.reduce(
  (total, service) => total + Number(service.price || 0),
  0
);

function toggleServiceSelection(serviceId) {
  setSelectedServiceIds((currentIds) =>
    currentIds.includes(serviceId)
      ? currentIds.filter((id) => id !== serviceId)
      : [...currentIds, serviceId]
  );
  setSelectedSlot(null);
  setAvailableSlots([]);
}



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
    let active = true;

    async function loadSlots() {
      if (!company?._id || !selectedStaff || selectedServiceIds.length === 0 || !selectedDate) {
        setAvailableSlots([]);
        setLoadingSlots(false);
        return;
      }
      
      setLoadingSlots(true);
      setError('');
      setSuccessMessage('');
      try {
        const response = await appointmentService.getAvailableSlots(
          company._id,
          selectedStaff,
          selectedServiceIds,
          selectedDate
        );
        if (active) setAvailableSlots(response.availableSlots);
      } catch (err) {
        if (active) {
          setError(err.message || 'Erro ao carregar horários.');
          setAvailableSlots([]);
        }
      } finally {
        if (active) setLoadingSlots(false);
      }
    }

    loadSlots();
    return () => {
      active = false;
    };
  }, [selectedDate, selectedStaff, selectedServiceIds, company]);

    async function handleBookAppointment(dateTimeIso) {
      if (!signed) {
        // 🌟 ATUALIZADO: Salva o estado atual usando a chave 'returnToBooking' que seu login já escuta
        navigate(`/${companySlug}/login`, { 
          state: { 
            returnToBooking: true,
            selectedServices: selectedServiceIds,
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
            serviceIds: selectedServiceIds,
            startTime: dateTimeIso,
          });

          const dadosDoAgendamento = {
            servico: selectedServiceDetails.map((service) => service.name).join(', ') || 'Serviços Selecionados',
            profissional: staffList.find(st => st._id === selectedStaff)?.name || 'Profissional Selecionado',
            data: selectedDate,
            horario: formatBusinessTime(dateTimeIso),
            duracao: selectedServiceDuration,
            checkoutUrl: response.checkoutUrl
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

      // 🌟 NOVA FUNÇÃO: Gera o link do WhatsApp com os dados salvos em confirmedData
  function handleNotificarWhatsApp() {
  // Passamos os dados atuais para o helper gerando o link do fluxo 'cliente'
  const url = gerarLinkWhatsApp(confirmedData, company, 'cliente');
  
  if (url) {
    window.open(url, '_blank');
  }
}

  function handleFinishBooking() {
    setSelectedServiceIds([]);
    setSelectedStaff('');
    setSelectedSlot(null);
    setConfirmedData(null);
    setStep('perfil');
  }


  // 🌟 NOVO EFFECT: Escuta o retorno do login e reconstrói o formulário na hora
  useEffect(() => {
    // Se o state contiver o sinalizador de retorno e dados válidos de serviço:
    if (
      location.state?.returnToBooking &&
      (location.state?.selectedServices?.length || location.state?.selectedService)
    ) {
      console.log("🔄 Restaurando dados selecionados pós-login:", location.state);
      
      // Reinjeta os dados clicados de volta nos estados locais do React
      setSelectedServiceIds(
        location.state.selectedServices ||
        (location.state.selectedService ? [location.state.selectedService] : [])
      );
      
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
          {step !== 'perfil' && (
            <button
              type="button"
              className={styles.historyNavButton}
              onClick={() => navigate(`/${companySlug}/minha-conta`)}
            >
              📅 Minha Conta
            </button>
          )}
          
          <button type="button" className={styles.logoutButton} onClick={handleLogout}>
            Sair
          </button>
        </div>
      )}

      </header>

      {checkoutReturnMessage && (
        <div className={styles.alertSuccess} role="status">
          {checkoutReturnMessage}
        </div>
      )}
      
      {/* TELA 1: PERFIL */}
      {/* 🌟 TELA 1: PERFIL DO ESTABELECIMENTO (NOVO COMPONENTE) */}
      {step === 'perfil' && (
        <PerfilEstabelecimento 
          company={company}
          services={services}
          signed={signed}
          companySlug={companySlug}
          onSelectService={(serviceId) => {
            // Guarda o serviço clicado direto do card
            setSelectedServiceIds([serviceId]);
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
            {/* 1. SELEÇÃO DE SERVIÇO EM CARDS */}
<div className={styles.inputField}>
  <label className={styles.fieldLabel}>1. Selecione um ou mais serviços:</label>
  <div className={styles.servicesGridList}>
    {services.map(s => {
      const isSelected = selectedServiceIds.includes(s._id);
      return (
        <div 
          key={s._id}
          className={`${styles.serviceSelectCard} ${isSelected ? styles.cardActive : ''}`}
          role="checkbox"
          aria-checked={isSelected}
          tabIndex={0}
          onClick={() => toggleServiceSelection(s._id)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              toggleServiceSelection(s._id);
            }
          }}
        >
          {/* Nova miniatura da imagem se houver URL válida */}
          {s.imageUrl && (
            <img 
              src={s.imageUrl} 
              alt={s.name} 
              className={styles.serviceThumbnail}
              style={{ width: '50px', height: '50px', borderRadius: '6px', objectFit: 'cover', marginRight: '12px' }}
            />
          )}
          
          <div className={styles.serviceInfoLeft}>
            <h3>{s.name}</h3>
            <span>⏱️ {s.durationInMinutes} min</span>
          </div>
          <div className={styles.servicePriceRight}>
            {/* Correção de R\$ para o formato limpo com vírgula */}
            <strong>R\$ {Number(s.price).toFixed(2).replace('.', ',')}</strong>
            <span className={`${styles.serviceSelectionIndicator} ${isSelected ? styles.serviceSelectionIndicatorActive : ''}`}>
              {isSelected ? '✓ Selecionado' : '+ Adicionar'}
            </span>
          </div>
          {selectedServiceDetails.length > 0 && (
            <div className={styles.selectedServicesSummary} aria-live="polite">
              <strong>
                {selectedServiceDetails.length} serviço{selectedServiceDetails.length > 1 ? 's' : ''} selecionado{selectedServiceDetails.length > 1 ? 's' : ''}
              </strong>
              <span>Duração total: {selectedServiceDuration} min</span>
              <span>
                Total: R$ {selectedServiceTotal.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
            </div>
          )}
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
              
              {selectedServiceIds.length === 0 || !selectedStaff ? (
                <div className={styles.slotsEmptyState}>Selecione ao menos um serviço e o profissional acima para liberar os horários.</div>
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

            <span className={styles.successBadge}>AGENDAMENTO CONFIRMADO</span>
            <h1>Agendamento Confirmado!</h1>
            <p className={styles.successSubtitle}>
              {confirmedData.checkoutUrl
                ? <>Seu horário está confirmado no estabelecimento <strong>{company?.name}</strong>. Você pode pagar pelo checkout agora ou depois pela Minha Conta, ou diretamente no estabelecimento.</>
                : <>Seu horário está confirmado no estabelecimento <strong>{company?.name}</strong>. O pagamento poderá ser feito diretamente no estabelecimento.</>}
            </p>

              
            {/* Bilhete/Resumo com os detalhes do agendamento */}
            <div className={styles.ticketContainer}>
              <div className={styles.ticketRow}>
                <span>{selectedServiceDetails.length > 1 ? 'Serviços:' : 'Serviço:'}</span>
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
                <span>{confirmedData.duracao} min</span>
              </div>
            </div>

            {/* Bloco de avisos importantes (Gera segurança psicológica) */}
            <div className={styles.reminderBox}>
              {confirmedData.checkoutUrl
                ? <>💡 O horário já está confirmado. Escolha pagar pelo checkout agora, depois pela <strong>Minha Conta</strong>, ou no estabelecimento no dia do atendimento.</>
                : <>💡 O horário já está confirmado. O pagamento será feito no estabelecimento, no dia do atendimento.</>}
            </div>

            {/* Ações Finais */}
            <div className={styles.successActionsGrid}>
              {confirmedData.checkoutUrl && (
                <>
                  <a
                    href={confirmedData.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.btnCalendar}
                  >
                    Ir para o Pagamento
                  </a>
                  <button
                    type="button"
                    className={styles.btnRestart}
                    onClick={() => navigate(`/${companySlug}/minha-conta`)}
                  >
                    Acessar Minha Conta para pagar depois
                  </button>
                  <button
                    type="button"
                    className={styles.btnRestart}
                    onClick={handleFinishBooking}
                  >
                    Pagar no estabelecimento
                  </button>
                </>
              )}
              
              {!confirmedData.checkoutUrl && (
                <button
                  type="button"
                  className={styles.btnRestart}
                  onClick={handleFinishBooking}
                >
                  Voltar para o Início
                </button>
              )}
            </div>

            <div className={styles.profileFooter}>
              <button onClick={handleNotificarWhatsApp} className={styles.btnWhatsapp}>
                <FaWhatsapp style={{ marginRight: '8px' }} /> 
                Receber Lembrete via WhatsApp
              </button> 
             </div>

          </div>
        </div>
      )}


    </div>
  );
}
