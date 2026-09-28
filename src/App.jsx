// Adicione o "useNavigate" nas importações do react-router-dom
import { useParams, useNavigate, useLocation } from 'react-router-dom'; 
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { appointmentService } from './services/appointmentService';
import { FaWhatsapp } from 'react-icons/fa';
import { useAuth } from './contexts/AuthContext'; // Importando nosso contexto
import styles from './App.module.css';

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
  useEffect(() => {
    async function loadCompany() {
      try {
        setLoadingCompany(true);
        const response = await appointmentService.getCompanyBySlug(companySlug);
        
        // Mapeamento compatível e seguro para ler os dados da empresa
        const fetchedCompany = response?.company || response?.data?.company || response?.data || response;
        setCompany(fetchedCompany);
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
      alert('Você precisa estar logado para realizar um agendamento.');
      navigate(`/${companySlug}/login`);
      return;
    }

    // Trava redundante de segurança no clique do agendamento
    if (user?.companyId && company?._id && user.companyId !== company._id) {
      alert(`Sua conta está vinculada a outro estabelecimento. Por favor, faça login com uma conta válida.`);
      logout();
      navigate(`/${companySlug}/login`);
      return;
    }

    if (!window.confirm('Confirmar agendamento?')) return;
    setError('');
    try {
      const response = await appointmentService.createAppointment({
        companyId: company._id,
        customerId: user._id, 
        professionalId: selectedStaff,
        serviceId: selectedService,
        startTime: dateTimeIso,
      });
      setSuccessMessage(response.message);
      setAvailableSlots((prev) => prev.filter((slot) => slot.dateTimeIso !== dateTimeIso));
    } catch (err) {
      setError(err.message);
    }
  }

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
            <button
              type="button"
              className={styles.logoutButton}
              onClick={handleLogout}
            >
              Sair
            </button>
          </div>
        )}
      </header>
      
      {/* TELA 1: PERFIL */}
      {step === 'perfil' && (
        <div className={styles.cardContainer}>
          <div>
            <div className={styles.profileHeader}>
              <div className={styles.avatarCircle}>
                {company?.name ? company.name.charAt(0).toUpperCase() : '🏢'}
              </div>
              <h1>{company?.name}</h1>
              <span className={styles.verifiedBadge}>✓ Estabelecimento Verificado</span>
            </div>

            <div className={styles.welcomeBody}>
              <h2>Olá! Seja bem-vindo(a).</h2>
              <p>Escolha os melhores serviços, veja os horários disponíveis e reserve o seu atendimento em poucos cliques.</p>
              
              {/* Vitrine Informativa dos Serviços Prestados */}
              {services.length > 0 && (
                <div className={styles.previewServicesContainer}>
                  <h3>Serviços prestados no local:</h3>
                  <div className={styles.previewServicesList}>
                    {services.slice(0, 3).map(s => (
                      <div key={s._id} className={styles.previewServiceCard}>
                        <span>{s.name}</span>
                        <strong>R\$ {s.price.toFixed(2)}</strong>
                      </div>
                    ))}
                    {services.length > 3 && (
                      <p className={styles.moreServicesCount}>+ {services.length - 3} outros serviços disponíveis</p>
                    )}
                  </div>
                </div>
              )}

              <button onClick={handleStartBooking} className={styles.btnActionPrimary}>
                📅 Iniciar Agendamento
              </button>
            </div>
          </div>

          <div className={styles.profileFooter}>
            {company?.phone && (
              <a 
                href={`https://wa.me{company.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className={styles.whatsappLink}
              >
                <FaWhatsapp size={20} /> Precisa de ajuda? Falar com o local
              </a>
            )}
            <p>© {new Date().getFullYear()} {company?.name}. Todos os direitos reservados.</p>
          </div>
        </div>
      )}

      

      {/* TELA 2: FORMULÁRIO */}
      {step === 'formulario' && (
        <div className={styles.cardContainer}>
          <div className={styles.formHeader}>
            <button onClick={() => setStep('perfil')} className={styles.btnBack}>⬅️</button>
            <div>
              <h1>{company?.name}</h1>
              <p>Preencha os dados abaixo</p>
            </div>
          </div>

          <div className={styles.formBody}>
            {error && <div className={styles.alertError}>⚠️ {error}</div>}
            {successMessage && <div className={styles.alertSuccess}>✅ {successMessage}</div>}

            <div className={styles.inputField}>
              <label>1. Escolha o Serviço:</label>
              <select
                value={selectedService}
                onChange={(e) => {
                  setSelectedService(e.target.value);
                  setAvailableSlots([]);
                }}
              >
                <option value="">Selecione um serviço...</option>
                {services.map(s => (
                  <option key={s._id} value={s._id}>{s.name} - R$ {s.price.toFixed(2)} ({s.durationInMinutes} min)</option>
                ))}
              </select>
            </div>

            <div className={styles.inputField}>
              <label>2. Escolha o Profissional:</label>
              <select
                value={selectedStaff}
                onChange={(e) => {
                  setSelectedStaff(e.target.value);
                  setAvailableSlots([]);
                }}
              >
                <option value="">Selecione um profissional...</option>
                {staffList.map(st => (
                  <option key={st._id} value={st._id}>{st.name}</option>
                ))}
              </select>
            </div>

            <div className={styles.inputField}>
              <label>3. Selecione o Dia:</label>
              <input
                type="date"
                value={selectedDate}
                min={format(new Date(), 'yyyy-MM-dd')}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className={styles.slotsDivider}>
              <h2 className={styles.slotsTitle}>Horários para {dateFormatted}:</h2>
              
              {!selectedService || !selectedStaff ? (
                <div className={styles.slotsEmptyState}>Selecione o serviço e o profissional para liberar os horários.</div>
              ) : loadingSlots ? (
                <div className={styles.slotsLoading}>Carregando horários vagos...</div>
              ) : availableSlots.length === 0 ? (
                <div className={styles.slotsEmptyState}>Não há horários disponíveis para este profissional nesta data.</div>
              ) : (
                <div className={styles.slotsGrid}>
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.dateTimeIso}
                      type="button"
                      onClick={() => handleBookAppointment(slot.dateTimeIso)}
                      className={styles.btnSlot}
                    >
                      {slot.time || format(new Date(slot.dateTimeIso), 'HH:mm')}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
