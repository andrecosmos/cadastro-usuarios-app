// src/App.jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { appointmentService } from './services/appointmentService';

// ⚠️ Mantenha apenas o ID do cliente fixado simulatando o usuário logado no app
const CUSTOMER_ID = "6aa063fbb68397d9ee19d588"; 

export default function App() {
  const { companySlug } = useParams();
  
  const [company, setCompany] = useState(null);
  const [services, setServices] = useState([]);
  const [staffList, setStaffList] = useState([]);
  
  // Estados para o que o usuário escolheu na tela
  const [selectedService, setSelectedService] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 1. Carrega os dados da Empresa pelo Slug da URL
  useEffect(() => {
    async function loadCompany() {
      try {
        setLoadingCompany(true);
        const response = await appointmentService.getCompanyBySlug(companySlug);
        setCompany(response.company);
      } catch (err) {
        setError(err.message || 'Estabelecimento não encontrado.');
      } finally {
        setLoadingCompany(false);
      }
    }
    if (companySlug) loadCompany();
  }, [companySlug]);

  // 2. Carrega as listas de Serviços e Profissionais após descobrir o ID da Empresa
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
        setError('Erro ao carregar os dados de atendimento do estabelecimento.');
      }
    }
    loadCompanyData();
  }, [company]);

  // 3. Busca horários livres APENAS quando Serviço, Profissional e Data estiverem definidos
  useEffect(() => {
    async function loadSlots() {
      if (!company?._id || !selectedStaff || !selectedService || !selectedDate) {
        setAvailableSlots([]); // Limpa se faltar alguma seleção
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
    if (!window.confirm('Confirmar agendamento?')) return;
    setError('');
    try {
      const response = await appointmentService.createAppointment({
        companyId: company._id,
        customerId: CUSTOMER_ID,
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
    return <div className="flex min-h-screen items-center justify-center text-gray-500 font-sans">Identificando estabelecimento...</div>;
  }

  if (error && !company) {
    return <div className="flex min-h-screen items-center justify-center text-red-500 font-sans p-4 text-center">⚠️ {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 font-sans">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Cabeçalho */}
        <div className="bg-indigo-600 px-6 py-6 text-white text-center">
          <h1 className="text-xl font-bold tracking-tight">{company?.name}</h1>
          <p className="text-indigo-100 text-sm mt-1">Selecione as opções abaixo para agendar</p>
        </div>

        <div className="p-6">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">⚠️ {error}</div>}
          {successMessage && <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg">✅ {successMessage}</div>}

          {/* Passo 1: Seleção de Serviço */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">1. Escolha o Serviço:</label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Selecione um serviço...</option>
              {services.map(s => (
                <option key={s._id} value={s._id}>{s.name} - R$ {s.price.toFixed(2)} ({s.durationInMinutes} min)</option>
              ))}
            </select>
          </div>

          {/* Passo 2: Seleção de Profissional */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">2. Escolha o Profissional:</label>
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Selecione um profissional...</option>
              {staffList.map(st => (
                <option key={st._id} value={st._id}>{st.name}</option>
              ))}
            </select>
          </div>

          {/* Passo 3: Seleção de Data */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1">3. Selecione o Dia:</label>
            <input
              type="date"
              value={selectedDate}
              min={format(new Date(), 'yyyy-MM-dd')}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Painel de Horários */}
          <div className="border-t border-gray-100 pt-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 capitalize">Horários para {dateFormatted}:</h2>
            
            {!selectedService || !selectedStaff ? (
              <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-xl border border-dashed text-xs">
                Selecione o serviço e o profissional para liberar os horários.
              </div>
            ) : loadingSlots ? (
              <div className="text-center py-6 text-gray-500 text-sm">Carregando horários vagos...</div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-xl border border-dashed text-sm">
                Não há horários disponíveis para este profissional nesta data.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.dateTimeIso}
                    onClick={() => handleBookAppointment(slot.dateTimeIso)}
                    className="py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-xl text-center text-sm border border-indigo-100/50 transition-all duration-150 active:scale-95"
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
