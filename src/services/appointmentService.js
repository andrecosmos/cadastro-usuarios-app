// src/services/appointmentService.js
import { api } from './api.js';

export const appointmentService = {
  // 1. Cadastra uma nova empresa parceira
  createCompany: (companyData) => {
    return api.post('/api/companies/create', companyData);
  },

  // 2. Cadastra um serviço para uma empresa
  createService: (serviceData) => {
    return api.post('/api/services/create', serviceData);
  },

  // 3. Busca a lista de horários livres de um profissional em um dia específico
  getAvailableSlots: (companyId, professionalId, serviceId, date) => {
    return api.get('/api/appointments/available-slots', {
      params: { companyId, professionalId, serviceId, date }
    });
  },

  // 4. Cria e fixa um novo agendamento
  createAppointment: (appointmentData) => {
    return api.post('/api/appointments/create', appointmentData);
  },

  // 5. Lista a agenda completa de um dia para o painel do estabelecimento
  listAppointments: (companyId, date) => {
    return api.get('/api/appointments/list', {
      params: { companyId, date }
    });
  },

    // Adicione esta função dentro do objeto appointmentService
  getCompanyBySlug: (slug) => {
    return api.get(`/api/companies/get-by-slug?slug=${slug}`);
  },
  

    // Adicione estas duas funções dentro do objeto appointmentService existente:
  getServicesByCompany: (companyId) => {
    return api.get(`/api/services/list-by-company?companyId=${companyId}`);
  },

  getStaffByCompany: (companyId) => {
    return api.get(`/api/staff/list-by-company?companyId=${companyId}`);
  },


  // 6. Altera o status (ex: conclui ou cancela um agendamento)
  updateStatus: (appointmentId, companyId, status) => {
    return api.patch('/api/appointments/update-status', { appointmentId, companyId, status });
  }
};
