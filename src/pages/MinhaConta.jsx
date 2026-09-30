import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { appointmentService } from '../services/appointmentService';
import { formatBusinessDate, formatBusinessTime } from '../../shared/dateTime.js';
import styles from './MinhaConta.module.css';

export default function MinhaConta() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { companySlug } = useParams();

  // Estados de navegação e controle
  const [activeTab, setActiveTab] = useState('horarios');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para armazenar os blocos vindos do backend
  const [proximosAgendamentos, setProximosAgendamentos] = useState([]);
  const [passadosAgendamentos, setPassadosAgendamentos] = useState([]);

  // Estados do formulário de perfil (Meus Dados)
  const [nome, setNome] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [sucessoPerfil, setSucessoPerfil] = useState('');

  // Busca os agendamentos globais ao carregar a página
  // 🌟 ATUALIZADO: Monitora o carregamento e lê o ID atualizado diretamente do localStorage
    useEffect(() => {
    // Busca direto da memória persistente do navegador para evitar o ID antigo da renderização passada
    const userCache = localStorage.getItem('@App:user');
    
    if (userCache) {
      const userData = JSON.parse(userCache);
      const idAtualizado = userData?._id || userData?.id;
      
      if (idAtualizado) {
        console.log("🚀 Identificado o ID correto de busca:", idAtualizado);
        carregarHistoricoGlobal(idAtualizado);
        return;
      }
    }

    // Plano B usando o contexto global se o cache falhar
    if (user?._id || user?.id) {
      carregarHistoricoGlobal(user._id || user.id);
    }
  }, []); // Executa estritamente uma vez assim que a tela abre

  // Mantemos a função carregarHistoricoGlobal recebendo o ID correto
   async function carregarHistoricoGlobal(idDoCliente) {
    setLoading(true);
    setError('');
    try {
      console.log("📡 Disparando chamada HTTP para o ID:", idDoCliente);
      const response = await appointmentService.getCustomerAppointments(idDoCliente);
      
      // 🌟 DIAGNÓSTICO DO NAVEGADOR: Descobre exatamente como o pacote chegou no React
      console.log("📥 RESPOSTA BRUTA RECEBIDA DO AXIOS:", response);

      // Tratamento inteligente: tenta ler de response.data ou direto de response caso já venha limpo
      const dadosDoServidor = response.data || response;
      console.log("📦 CONTEÚDO EXTRAÍDO DA RESPOSTA:", dadosDoServidor);

      if (dadosDoServidor && (dadosDoServidor.success || dadosDoServidor.proximos || dadosDoServidor.passados)) {
        const proximos = dadosDoServidor.proximos || [];
        const passados = dadosDoServidor.passados || [];
        
        console.log(`✨ Gravando nos estados do React -> Próximos: ${proximos.length} | Passados: ${passados.length}`);
        
        setProximosAgendamentos(proximos);
        setPassadosAgendamentos(passados);
      } else {
        console.warn("⚠️ O formato da resposta não possui as chaves esperadas.");
        setProximosAgendamentos([]);
        setPassadosAgendamentos([]);
      }
    } catch (err) {
      console.error("❌ ERRO AO EXECUTAR FETCH NO COMPONENTE REACT:", err);
      setError('Não foi possível carregar o seu histórico.');
    } finally {
      setLoading(false);
    }
  }



  async function handleCancelarHorario(appointmentId) {
    if (!window.confirm('Tem certeza que deseja cancelar este agendamento?')) return;

    try {
      // 🌟 Chama o service de exclusão passando o ID do agendamento e do cliente
      await appointmentService.cancelAppointmentByCustomer(appointmentId, user._id);
      
      // Atualiza o estado local removendo o horário cancelado na hora
      setProximosAgendamentos(prev => prev.filter(app => app._id !== appointmentId));
      alert('Agendamento cancelado com sucesso.');
    } catch (err) {
      alert('Erro ao cancelar horário: ' + (err.response?.data?.message || err.message));
    }
  }

  async function handleSalvarPerfil(e) {
    e.preventDefault();
    setSucessoPerfil('');
    setError('');
    try {
      // Aqui você integrará futuramente com seu método de atualizar cliente, ex:
      // await appointmentService.updateCustomer(user._id, { name: nome });
      setSucessoPerfil('Dados atualizados com sucesso!');
    } catch (err) {
      setError('Erro ao atualizar perfil.');
    }
  }

  const handleLogoutConta = () => {
    logout();
    navigate('/'); // Chuta de volta para a landing page global
  };

  return (
    <div className={styles.pageWrapper}>
           {/* CABEÇALHO DO PAINEL DO CLIENTE */}
      <header className={styles.panelHeader}>
        {/* 🌟 ATUALIZADO: Redireciona para o estabelecimento ou para a home se não houver slug */}
        <div 
          className={styles.headerBrand} 
          onClick={() => navigate(companySlug ? `/${companySlug}` : '/')}
          style={{ cursor: 'pointer' }}
        >
          <span>JÁRESERVA</span>
          <small>Área do Cliente</small>
        </div>
        
        <div className={styles.headerActions}>
          <span className={styles.userName}>Olá, <strong>{user?.name || 'Cliente'}</strong></span>
          <button className={styles.btnLogout} onClick={handleLogoutConta}>Sair da Conta</button>
        </div>
      </header>


      <main className={styles.mainContent}>
        {/* NAVEGAÇÃO POR ABAS INTERNAS */}
        <div className={styles.tabsContainer}>
          <button 
            className={`${styles.tabLink} ${activeTab === 'horarios' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('horarios')}
          >
            📅 Meus Horários
          </button>
          <button 
            className={`${styles.tabLink} ${activeTab === 'perfil' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('perfil')}
          >
            👤 Meus Dados
          </button>
        </div>

        {/* --- ABA 1: MEUS HORÁRIOS --- */}
        {activeTab === 'horarios' && (
          <div className={styles.tabPanel}>
            {error && <div className={styles.alertError}>⚠️ {error}</div>}

            {loading ? (
              <div className={styles.loadingState}>Buscando seus horários em todos os estabelecimentos...</div>
            ) : proximosAgendamentos.length === 0 && passadosAgendamentos.length === 0 ? (
              <div className={styles.emptyState}>Você ainda não possui nenhum agendamento registrado.</div>
            ) : (
              <div className={styles.timelineWrapper}>
                
                                {/* SEÇÃO: PRÓXIMOS AGENDAMENTOS BLINDADA */}
                <div className={styles.sectionGroup}>
                  <h2 className={styles.sectionTitle}>📌 Próximos Agendamentos</h2>
                  {proximosAgendamentos.length === 0 ? (
                    <p className={styles.noDataText}>Nenhum horário marcado para os próximos dias.</p>
                  ) : (
                    proximosAgendamentos.map(app => {
                      // 🌟 MARGEM DE SEGURANÇA: Extrai os dados tolerando qualquer nome de chave vindo do banco
                      const nomeEmpresa = app.companyId?.name || app.company?.name || 'Estabelecimento';
                      const nomeServico = app.serviceId?.name || app.service?.name || 'Serviço Personalizado';
                      const nomeProfissional = app.professionalId?.name || app.professional?.name || 'Profissional do Local';
                      
                      // Garante que o preço não quebre se vier nulo ou indefinido
                      const precoOriginal = app.serviceId?.price || app.service?.price || 0;
                      const precoFormatado = typeof precoOriginal === 'number' ? precoOriginal.toFixed(2) : '0.00';

                      // Tratamento seguro de data para evitar quebras de fuso horário
                      let dataExibicao = '00/00/0000';
                      let horaExibicao = '00:00';
                      
                      if (app.startTime) {
                        try {
                          dataExibicao = formatBusinessDate(app.startTime);
                          horaExibicao = formatBusinessTime(app.startTime);
                        } catch (e) {
                          // Fallback nativo simples caso o date-fns falhe com a string ISO
                          const d = new Date(app.startTime);
                          dataExibicao = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                          horaExibicao = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                        }
                      }

                      return (
                        <div key={app._id} className={`${styles.appointmentCard} ${styles.cardFuture}`}>
                          <div className={styles.cardHeader}>
                            <span className={styles.companyName}>🏢 {nomeEmpresa}</span>
                            <div className={styles.dateTimeBadge}>
                              <strong>{horaExibicao}</strong>
                              <span>{dataExibicao}</span>
                            </div>
                          </div>
                          <div className={styles.cardBody}>
                            <h3>{nomeServico}</h3>
                            <p>Profissional: <strong>{nomeProfissional}</strong></p>
                            <small>Preço: R\$ {precoFormatado}</small>
                          </div>
                          <div className={styles.cardFooterFuture}>
                            <button 
                              type="button" 
                              className={styles.btnCancel}
                              onClick={() => handleCancelarHorario(app._id)}
                            >
                              ❌ Cancelar Agendamento
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>


                {/* SEÇÃO: HISTÓRICO PASSADO */}
                <div className={styles.sectionGroup}>
                  <h2 className={styles.sectionTitle}>⌛ Atendimentos Passados</h2>
                  {passadosAgendamentos.length === 0 ? (
                    <p className={styles.noDataText}>Nenhum histórico de atendimento anterior.</p>
                  ) : (
                    passadosAgendamentos.map(app => (
                      <div key={app._id} className={`${styles.appointmentCard} ${styles.cardPast}`}>
                        <div className={styles.cardHeader}>
                          <span className={styles.companyName}>🏢 {app.companyId?.name || 'Estabelecimento'}</span>
                          <div className={styles.dateTimeBadgePast}>
                            <strong>{app.startTime ? formatBusinessTime(app.startTime) : '00:00'}</strong>
                            <span>{app.startTime ? formatBusinessDate(app.startTime) : '00/00/0000'}</span>
                          </div>
                        </div>
                        <div className={styles.cardBody}>
                          <h3>{app.serviceId?.name || 'Serviço'}</h3>
                          <p>Profissional: {app.professionalId?.name || 'Não informado'}</p>
                        </div>
                        <div className={styles.cardFooterPast}>
                          <span className={styles.statusDone}>✓ Realizado</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            )}
          </div>
        )}

        {/* --- ABA 2: MEUS DADOS --- */}
        {activeTab === 'perfil' && (
          <div className={styles.tabPanel}>
            <div className={styles.profileFormCard}>
              <h2>Editar Informações Pessoais</h2>
              <p>Mantenha seus dados de contato atualizados para receber os lembretes por WhatsApp.</p>

              {sucessoPerfil && <div className={styles.alertSuccess}>✅ {sucessoPerfil}</div>}

              <form onSubmit={handleSalvarPerfil} className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <label>Nome Completo</label>
                  <input 
                    type="text" 
                    value={nome} 
                    onChange={(e) => setNome(e.target.value)} 
                    required 
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>E-mail cadastrado</label>
                  <input 
                    type="email" 
                    value={email} 
                    disabled 
                    className={styles.inputDisabled}
                  />
                  <small>O e-mail não pode ser alterado por segurança.</small>
                </div>
                <button type="submit" className={styles.btnSaveProfile}>💾 Salvar Alterações</button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
