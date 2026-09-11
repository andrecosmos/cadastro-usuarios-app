import express from 'express';
import { connectToDatabase } from './_config/database.js';
import { Company } from './_models/Company.js';
import { Customer } from './_models/Customer.js';
import { Appointment } from './_models/Appointment.js';
import { Service } from './_models/Service.js';
import { Staff } from './_models/Staff.js';

const app = express();
app.use(express.json());

// Middleware de conexão direta com o banco de dados
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Erro de banco: ' + error.message });
  }
});

function generateSlug(text) {
  return text.toString().toLowerCase().trim().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-').replace(/-+/g, '-');
}

// ==========================================
// ROTAS: COMPANIES & CUSTOMERS
// ==========================================
app.post('/api/companies/create', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email || !phone) return res.status(400).json({ error: 'Campos ausentes.' });
    const slug = generateSlug(name);
    const companyExists = await Company.findOne({ $or: [{ email }, { slug }] });
    if (companyExists) return res.status(400).json({ error: 'Empresa já existe.' });
    const newCompany = await Company.create({ name, slug, email, phone, planStatus: 'trial' });
    return res.status(201).json({ success: true, data: newCompany });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

app.get('/api/companies/get-by-slug', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const { slug } = req.query;
    if (!slug) return res.status(400).json({ error: 'Slug obrigatório.' });
    const company = await Company.findOne({ slug });
    if (!company) return res.status(404).json({ error: 'Não encontrado.' });
    return res.status(200).json({ success: true, company });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

app.post('/api/customers/create', async (req, res) => {
  try {
    const { companyId, name, email, phone } = req.body;
    if (!companyId || !name || !phone) return res.status(400).json({ error: 'Campos ausentes.' });
    const newCustomer = await Customer.create({ companyId, name, email, phone });
    return res.status(201).json({ success: true, data: newCustomer });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// ==========================================
// ROTAS: APPOINTMENTS (LISTAGEM DO ADMIN)
// ==========================================
app.get('/api/appointments/list', async (req, res) => {
  try {
    const { companyId, date } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId obrigatório.' });

    let queryFilter = { companyId };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setUTCHours(23, 59, 59, 999);
      queryFilter.startTime = { $gte: startOfDay, $lte: endOfDay };
    }

    const appointments = await Appointment.find(queryFilter)
      .populate('customerId')
      .populate('serviceId')
      .populate('professionalId');

    return res.status(200).json({ success: true, data: appointments });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// ==========================================
// ROTAS: APPOINTMENTS (SLOTS DA PÁGINA AGENDAR)
// ==========================================
app.get('/api/appointments/available-slots', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const { companyId, professionalId, date } = req.query;

    if (!companyId || !date) {
      return res.status(200).json({ availableSlots: [] });
    }

    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const existingAppointments = await Appointment.find({
      companyId,
      professionalId,
      startTime: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'canceled' }
    });

    // Grade padrão operacional de atendimento
    const defaultHours = [
      "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", 
      "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
    ];
    
    // Filtra e monta os objetos contendo a propriedade .dateTimeIso esperada pelo .map() do frontend
    const slotsFormatted = defaultHours
      .filter(time => {
        return !existingAppointments.some(app => {
          const appTime = new Date(app.startTime).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', minute: '2-digit', timeZone: 'UTC' 
          });
          return appTime === time;
        });
      })
      .map(time => {
        // Concatena a data com o horário para gerar a string ISO válida
        const dateTimeIso = new Date(`${date}T${time}:00.000Z`).toISOString();
        return { time, dateTimeIso };
      });

    // CORREÇÃO CRUCIAL: Responde exatamente no objeto esperado pelo useEffect do seu App.jsx
    return res.status(200).json({
      success: true,
      availableSlots: slotsFormatted
    });
  } catch (error) {
    return res.status(200).json({ availableSlots: [] });
  }
});

// NOVA ROTA: Criação de agendamentos vinda do formulário
app.post('/api/appointments/create', async (req, res) => {
  try {
    const { companyId, customerId, professionalId, serviceId, startTime } = req.body;
    
    if (!companyId || !customerId || !professionalId || !serviceId || !startTime) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
    }

    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ error: 'Serviço não encontrado.' });

    const start = new Date(startTime);
    const end = new Date(start.getTime() + service.durationInMinutes * 60000);

    const newAppointment = await Appointment.create({
      companyId, customerId, professionalId, serviceId,
      startTime: start, endTime: end, status: 'pending', paymentStatus: 'unpaid'
    });

    return res.status(201).json({
      success: true,
      message: 'Agendamento realizado com sucesso!',
      data: newAppointment
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ==========================================
// ROTAS: STATUS & AUXILIARES DO ADMIN
// ==========================================
const handleUpdateStatus = async (req, res) => {
  try {
    const { appointmentId, status } = req.body;
    if (!appointmentId || !status) return res.status(400).json({ error: 'Campos ausentes.' });
    const updated = await Appointment.findByIdAndUpdate(appointmentId, { status }, { new: true });
    if (!updated) return res.status(404).json({ error: 'Não encontrado.' });
    return res.status(200).json({ success: true, data: updated });
  } catch (e) { return res.status(500).json({ error: e.message }); }
};
app.put('/api/appointments/update-status', handleUpdateStatus);
app.patch('/api/appointments/update-status', handleUpdateStatus);

// ==========================================
// ROTAS: STAFF & SERVICES
// ==========================================
app.get('/api/staff/list-by-company', async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId obrigatório.' });
    const staffList = await Staff.find({ companyId, isActive: true }).populate('specialties');
    
    // CORREÇÃO CRUCIAL: Devolve a chave nomeada 'staff' esperada pelo setStaffList(staffRes.staff)
    return res.status(200).json({
      success: true,
      data: staffList,
      staff: staffList
    });
  } catch (e) { return res.status(200).json({ staff: [] }); }
});

app.get('/api/services/list-by-company', async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId obrigatório.' });
    const services = await Service.find({ companyId, isActive: true });
    
    // CORREÇÃO CRUCIAL: Devolve a chave nomeada 'services' esperada pelo setServices(servicesRes.services)
    return res.status(200).json({
      success: true,
      data: services,
      services: services
    });
  } catch (e) { return res.status(200).json({ services: [] }); }
});

export default app;
