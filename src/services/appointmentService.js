// src/services/appointmentService.js
import { api } from './api.js';

// Mantemos o interceptor apenas para segurança, ele não altera a estrutura dos dados
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@App:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const appointmentService = {
  // ==========================================
  // EMPRESAS
  // ==========================================
  createCompany: (companyData) => api.post('/api/companies/create', companyData),
  updateCompany: (companyId, companyData) => api.patch('/api/companies/update', { companyId, ...companyData }),
  getCompanyBySlug: (slug) => api.get(`/api/companies/get-by-slug?slug=${slug}`),

  // ==========================================
  // SERVIÇOS
  // ==========================================
  createService: (serviceData) => api.post('/api/services/create', serviceData),
  getServicesByCompany: (companyId) => api.get(`/api/services/list-by-company?companyId=${companyId}`),

    // ==========================================
  // AGENDAMENTOS (Atualizado para envio sem middleware)
  // ==========================================
  getAvailableSlots: (companyId, professionalId, serviceId, date) => 
    api.get('/api/appointments/available-slots', { params: { companyId, professionalId, serviceId, date } }),
  getAppointments: (companyId) => api.get('/api/appointments', { params: { companyId } }),
  createAppointment: (appointmentData) => api.post('/api/appointments/create', appointmentData),
  listAppointments: (companyId, date) => api.get('/api/appointments/list', { params: { companyId, date } }),
  updateStatus: (appointmentId, companyId, status) => api.patch('/api/appointments/update-status', { appointmentId, companyId, status }),
  
  // 🌟 ATUALIZADO: Recebe o customerId como parâmetro para enviar na URL
  getCustomerAppointments: () =>
    api.get('/api/cliente/meus-agendamentos'),

  // 🌟 ATUALIZADO: Passa o customerId junto no corpo (ou query) para garantir que ele só apague o dele
  cancelAppointmentByCustomer: (appointmentId) =>
    api.delete(`/api/cliente/cancelar/${appointmentId}`),


  // ==========================================
  // PROFISSIONAIS
  // ==========================================
  createStaff: (staffData) => api.post('/api/staff/create', staffData),
  getStaffByCompany: (companyId) => api.get(`/api/staff/list-by-company?companyId=${companyId}`),

  // ==========================================
  // CLIENTES
  // ==========================================  
  
 registerCustomer: (registerData) => api.post('/api/auth/register', registerData),

   
  
  createCustomer: (customerData) => api.post('/api/customers/create', customerData)


  







};

