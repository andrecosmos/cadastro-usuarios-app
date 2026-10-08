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
  uploadImage: (imageFile) => api.post('/api/upload', imageFile, {
    headers: {
      'Content-Type': imageFile.type
    }
  }),

  // ==========================================
  // SERVIÇOS
  // ==========================================
  createService: (serviceData) => api.post('/api/services/create', serviceData),
  getServicesByCompany: (companyId) => api.get(`/api/services/list-by-company?companyId=${companyId}`),

    // ==========================================
  // AGENDAMENTOS 
  // ==========================================
  searchCustomers: (companyId, query = '') =>
    api.get('/api/customers/search', { params: { companyId, q: query } }),
  getAvailableSlots: (companyId, professionalId, serviceId, date) => 
    api.get('/api/appointments/available-slots', { params: { companyId, professionalId, serviceId, date } }),
  getAppointments: (companyId) => api.get('/api/appointments', { params: { companyId } }),
  createAppointment: (appointmentData) => api.post('/api/appointments/create', appointmentData),
  listAppointments: (companyId, date) => api.get('/api/appointments/list', { params: { companyId, date } }),
  updateStatus: (appointmentId, companyId, status) => api.patch('/api/appointments/update-status', { appointmentId, companyId, status }),
  recordAppointmentPayment: (appointmentId, method) =>
    api.patch('/api/appointments/record-payment', { appointmentId, method }),
  getReportSummary: (companyId, from, to) =>
    api.get('/api/reports/summary', { params: { companyId, from, to } }),
  
 
  getCustomerAppointments: () =>api.get('/api/cliente/meus-agendamentos'),

  cancelAppointmentByCustomer: (appointmentId) =>api.delete(`/api/cliente/cancelar/${appointmentId}`),

  updateAppointmentByCustomer: (appointmentId, status) => api.patch(`/api/cliente/alterar/${appointmentId}`,{status}),

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
