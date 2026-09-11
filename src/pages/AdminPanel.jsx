// src/pages/AdminPanel.jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { appointmentService } from '../services/appointmentService';

export default function AdminPanel() {
  const { companySlug } = useParams();
  const [company, setCompany] = useState(null);
  const [activeMenu, setActiveMenu] = useState('dashboard'); // Menus: dashboard, cadastrar-servico, cadastrar-equipe
  
  // Estados para a lista de agendamentos e filtros
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [appointments, setAppointments] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. Carrega a empresa parceira pelo slug da URL
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

  // 2. Função isolada para carregar os agendamentos do banco de dados
  async function loadAppointments() {
    if (!company?._id) return;
    try {
      const response = await appointmentService.listAppointments(company._id, selectedDate);
      setAppointments(response.data);
    } catch (err) {
      console.error('Erro ao buscar agendamentos:', err);
    }
  }

  // Monitora quando a data ou a empresa mudam para atualizar a lista automaticamente
  useEffect(() => {
    if (company?._id && activeMenu === 'dashboard') {
      loadAppointments();
    }
  }, [selectedDate, company, activeMenu]);

  // 3. Função para alterar o status (Concluir / Cancelar)
  async function handleStatusChange(appointmentId, newStatus) {
    if (!window.confirm(`Deseja realmente mudar o status para ${newStatus}?`)) return;
    try {
      await appointmentService.updateStatus(appointmentId, company._id, newStatus);
      loadAppointments(); // Recarrega a lista atualizada após salvar
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) return <div className="p-8 text-center font-sans text-gray-500">Carregando painel...</div>;
  if (error) return <div className="p-8 text-center font-sans text-red-500">⚠️ {error}</div>;

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      
      {/* 1. MENU LATERAL DO ADMINISTRADOR (SIDEBAR) */}
      <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800">
        <div className="p-5 border-b border-slate-800 bg-slate-950">
          <h1 className="text-md font-bold text-white truncate">{company?.name}</h1>
          <span className="text-[10px] bg-indigo-500/20 text-indigo-400 font-semibold px-2 py-0.5 rounded-full mt-1 inline-block uppercase tracking-wider">
            Painel Admin
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          <button
            onClick={() => setActiveMenu('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
              activeMenu === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            📊 Visão Geral da Agenda
          </button>

          <button
            onClick={() => setActiveMenu('cadastrar-servico')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
              activeMenu === 'cadastrar-servico' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            🛠️ Cadastrar Serviço
          </button>

          <button
            onClick={() => setActiveMenu('cadastrar-equipe')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
              activeMenu === 'cadastrar-equipe' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            👥 Cadastrar Profissional
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
          v1.0.0 - SaaS Agendamentos
        </div>
      </aside>

      {/* 2. CONTEÚDO DINÂMICO */}
      <main className="flex-1 p-8 overflow-y-auto">
        
        {/* ================= TELA: VISÃO GERAL DA AGENDA ================= */}
        {activeMenu === 'dashboard' && (
          <div>
            {/* Cabeçalho Interno com Filtro de Data */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <div>
                <h2 className="text-lg font-bold text-gray-800 capitalize">
                  Fluxo de {format(new Date(selectedDate + 'T12:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </h2>
                <p className="text-xs text-gray-500">Monitore os atendimentos marcados para este dia</p>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-gray-700 font-medium"
              />
            </div>

            {/* Listagem dos Cards de Agendamento */}
            {appointments.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 text-gray-400">
                Nenhum agendamento marcado para esta data.
              </div>
            ) : (
              <div className="grid gap-4">
                {appointments.map((app) => (
                  <div key={app._id} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-gray-300">
                    
                    {/* Dados do Horário e Cliente */}
                    <div className="flex items-start gap-4">
                      <div className="bg-indigo-50 text-indigo-700 font-bold px-3 py-2 rounded-xl text-center min-w-[75px]">
                        <span className="text-sm block">{format(new Date(app.startTime), 'HH:mm')}</span>
                        <span className="text-xs text-indigo-400 font-normal">até {format(new Date(app.endTime), 'HH:mm')}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{app.customerId?.name}</h3>
                        <p className="text-xs text-gray-500">📞 {app.customerId?.phone}</p>
                        
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="bg-gray-100 text-gray-700 text-[11px] px-2 py-0.5 rounded-md font-medium">
                            🛠️ {app.serviceId?.name}
                          </span>
                          <span className="bg-purple-50 text-purple-700 text-[11px] px-2 py-0.5 rounded-md font-medium">
                            👤 Profissional: {app.professionalId?.name}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status e Ações */}
                    <div className="flex items-center gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 justify-end">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        app.status === 'completed' ? 'bg-green-100 text-green-700' : 
                        app.status === 'canceled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {app.status === 'confirmed' ? 'Confirmado' : app.status === 'completed' ? 'Concluído' : 'Cancelado'}
                      </span>

                      {app.status === 'confirmed' && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleStatusChange(app._id, 'completed')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-3 py-2 rounded-xl transition-all"
                          >
                            Concluir
                          </button>
                          <button
                            onClick={() => handleStatusChange(app._id, 'canceled')}
                            className="bg-white border border-red-200 text-red-600 text-xs px-3 py-2 rounded-xl hover:bg-red-50 transition-all"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TELA: CADASTRAR SERVIÇO ================= */}
        {activeMenu === 'cadastrar-servico' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Gerenciar Catálogo de Serviços</h2>
            <p className="text-sm text-gray-500">Aqui o administrador poderá criar novos serviços e definir preços e tempos de duração.</p>
          </div>
        )}

        {/* ================= TELA: CADASTRAR EQUIPE ================= */}
        {activeMenu === 'cadastrar-equipe' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Gerenciar Profissionais da Equipe</h2>
            <p className="text-sm text-gray-500">Aqui o administrador poderá adicionar colaboradores e gerenciar a equipe de atendimento.</p>
          </div>
        )}
        </main>

      </div>
    );
  }