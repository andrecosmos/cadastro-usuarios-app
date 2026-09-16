import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { appointmentService } from '../services/appointmentService';

// 1. IMPORTAR OS ESTILOS DO CSS MODULES
import styles from './AdminPanel.module.css';

export default function AdminPanel() {
  const { companySlug } = useParams();
  const [company, setCompany] = useState(null);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Controle de estado para abertura da Sidebar no mobile
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    async function loadCompany() {
      try {
        setLoading(true);
        const response = await appointmentService.getCompanyBySlug(companySlug);
        setCompany(response.company);
      } catch (err) {
        setError(err.message || 'Empresa não encontrada.');
      } finally {
        setLoading(false);
      }
    }
    if (companySlug) loadCompany();
  }, [companySlug]);

  const companyId = company?._id;
  const loadAppointments = useCallback(async () => {
    if (!companyId) return;
    try {
      const response = await appointmentService.listAppointments(companyId, selectedDate);
      setAppointments(response.data || []);
    } catch (err) {
      console.error('Erro ao buscar agendamentos:', err);
    }
  }, [companyId, selectedDate]);

  useEffect(() => {
    if (companyId && activeMenu === 'dashboard') {
      loadAppointments();
    }
  }, [companyId, selectedDate, activeMenu, loadAppointments]);

  async function handleStatusChange(appointmentId, newStatus) {
    const statusText = newStatus === 'completed' ? 'CONCLUÍDO' : 'CANCELADO';
    if (!window.confirm(`Deseja realmente mudar o status para ${statusText}?`)) return;
    
    try {
      await appointmentService.updateStatus(appointmentId, companyId, newStatus);
      loadAppointments();
    } catch (err) {
      alert(err.message || 'Erro ao atualizar status.');
    }
  }

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  if (loading) return <div className={styles.centerAlert}>Carregando painel...</div>;
  if (error) return <div className={`${styles.centerAlert} ${styles.error}`}>⚠️ {error}</div>;

  return (
    <div className={styles.layoutContainer}>
      
      {/* CABEÇALHO SUPERIOR (Apenas Celular) */}
      <header className={styles.mobileHeader}>
        <span className={styles.mobileTitle}>{company?.name || 'Painel Admin'}</span>
        <button type="button" className={styles.menuButton} onClick={toggleMenu}>
          ☰
        </button>
      </header>

      {/* SOMBREAMENTO DE FUNDO (Apenas Celular) */}
      {isMenuOpen && <div className={styles.overlay} onClick={toggleMenu} />}

      {/* MENU LATERAL RESPONSIVO */}
      <aside className={`${styles.sidebar} ${isMenuOpen ? styles.sidebarOpen : ''}`}>
        <button type="button" className={styles.closeButton} onClick={toggleMenu}>
          ✕ Fechar Menu
        </button>
        
        <div className={styles.sidebarHeader}>
          <h1 className={styles.companyName}>{company?.name}</h1>
          <span className={styles.badge}>Painel Admin</span>
        </div>

        <nav className={styles.navMenu}>
          <button
            onClick={() => { setActiveMenu('dashboard'); setIsMenuOpen(false); }}
            className={`${styles.navBtn} ${activeMenu === 'dashboard' ? styles.btnActive : styles.btnInactive}`}
          >
            📊 Visão Geral da Agenda
          </button>
        </nav>
      </aside>

      {/* CONTEÚDO DINÂMICO */}
      <main className={styles.mainContent}>
        {activeMenu === 'dashboard' && (
          <div>
            {/* Filtro de Data */}
            <div className={styles.filterCard}>
              <div>
                <h2 className={styles.filterTitle}>
                  Fluxo de {format(new Date(selectedDate + 'T12:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </h2>
                <p className={styles.filterSubtitle}>Monitore os atendimentos marcados para este dia</p>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={styles.dateInput}
              />
            </div>

            {/* Lista dos Cards */}
            {appointments.length === 0 ? (
              <div className={styles.alertCard}>
                Nenhum agendamento marcado para esta data.
              </div>
            ) : (
              <div className={styles.listGrid}>
                {appointments.map((app) => {
                  const startTimeStr = app.startTime ? new Date(app.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }) : '--:--';
                  const endTimeStr = app.endTime ? new Date(app.endTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }) : '--:--';

                  return (
                    <div key={app._id} className={styles.card}>
                      
                      <div className={styles.cardInfo}>
                        <div className={styles.timeBlock}>
                          <span className={styles.timeMain}>{startTimeStr}</span>
                          <span className={styles.timeSub}>até {endTimeStr}</span>
                        </div>
                        <div>
                          <h3 className={styles.customerName}>{app.customerId?.name}</h3>
                          <p className={styles.customerPhone}>📞 {app.customerId?.phone}</p>
                          <div className={styles.tags}>
                            <span className={styles.tagService}>🛠️ {app.serviceId?.name}</span>
                            <span className={styles.tagProfessional}>👤 Profissional: {app.professionalId?.name}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status e Ações */}
                      <div className={styles.cardActions}>
                        <span className={`${styles.statusBadge} ${
                          app.status === 'completed' ? styles.statusCompleted : 
                          app.status === 'canceled' ? styles.statusCanceled : styles.statusPending
                        }`}>
                          {app.status === 'completed' ? 'Concluído' : app.status === 'canceled' ? 'Cancelado' : 'Pendente'}
                        </span>

                        {app.status !== 'completed' && app.status !== 'canceled' && (
                          <div className={styles.btnGroup}>
                            <button
                              onClick={() => handleStatusChange(app._id, 'completed')}
                              className={styles.btnConfirm}
                            >
                              ✓ Concluir
                            </button>
                            <button
                              onClick={() => handleStatusChange(app._id, 'canceled')}
                              className={styles.btnCancel}
                            >
                              ✕ Cancelar
                            </button>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

    </div>
  );
}
