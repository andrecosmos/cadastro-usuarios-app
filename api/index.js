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
// ROTAS: APPOINTMENTS (LISTAGEM DO ADMIN COM COMPATIBILIDADE DE STATUS)
// ==========================================
app.get('/api/appointments/list', async (req, res) => {
  try {
    const { companyId, date } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId obrigatório.' });

    let queryFilter = { companyId };

    if (date) {
      const parts = date.split('-'); 
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; 
      const day = parseInt(parts[2], 10);

      const startOfDay = new Date(Date.UTC(year, month, day, 3, 0, 0, 0));
      const endOfDay = new Date(Date.UTC(year, month, day, 26, 59, 59, 999));

      queryFilter.startTime = { $gte: startOfDay, $lte: endOfDay };
    }

    const appointments = await Appointment.find(queryFilter)
      .populate('customerId')
      .populate('serviceId')
      .populate('professionalId')
      .lean(); // Converte em objetos JS puros para permitir a injeção de propriedades

    // Mapeia e blinda as propriedades de status e populates para o frontend React
    const treatedAppointments = appointments.map(app => {
      const currentStatus = app.status ? app.status.toString().toLowerCase().trim() : 'pending';

      return {
        ...app,
        _id: app._id ? app._id.toString() : "",
        status: currentStatus,
        
        // Injeta propriedades booleanas caso o front faça validações diretas por flag
        isPending: currentStatus === 'pending',
        isCanceled: currentStatus === 'canceled',
        isCompleted: currentStatus === 'completed',

        // Fallbacks de segurança para evitar quebras de renderização no card
        customerId: app.customerId || { name: "Cliente não encontrado", phone: "N/A" },
        serviceId: app.serviceId || { name: "Serviço não encontrado", price: 0, durationInMinutes: 0 },
        professionalId: app.professionalId || { name: "Profissional não encontrado" }
      };
    });

    return res.status(200).json({
      success: true,
      data: treatedAppointments
    });
  } catch (e) { 
    return res.status(500).json({ error: e.message }); 
  }
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

    // Validação retroativa segura por fuso de São Paulo
    const nowInBr = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const todayStr = nowInBr.getFullYear() + '-' + String(nowInBr.getMonth() + 1).padStart(2, '0') + '-' + String(nowInBr.getDate()).padStart(2, '0');

    if (date < todayStr) {
      return res.status(200).json({ availableSlots: [] });
    }

    const parts = date.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const startOfDay = new Date(Date.UTC(year, month, day, 3, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month, day, 26, 59, 59, 999));

    let appointmentFilter = {
      companyId,
      startTime: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'canceled' }
    };

    if (professionalId && professionalId !== 'undefined' && professionalId !== '') {
      appointmentFilter.professionalId = professionalId;
    }

    const existingAppointments = await Appointment.find(appointmentFilter);

    const defaultHours = [
      "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", 
      "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
    ];
    
    const slotsFormatted = defaultHours
      .filter(time => {
        const hourParts = time.split(':');
        const slotDateTime = new Date(Date.UTC(year, month, day, parseInt(hourParts[0], 10) + 3, parseInt(hourParts[1], 10), 0, 0));

        if (date === todayStr && slotDateTime < nowInBr) {
          return false;
        }

        const isOccupied = existingAppointments.some(app => {
          const appTime = new Date(app.startTime).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' 
          });
          return appTime === time;
        });

        return !isOccupied;
      })
      .map(time => {
        const hourParts = time.split(':');
        const dateTimeIso = new Date(Date.UTC(year, month, day, parseInt(hourParts[0], 10) + 3, parseInt(hourParts[1], 10), 0, 0)).toISOString();
        return { time, dateTimeIso };
      });

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

    const start = new Date(startTime);
    const nowInBr = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    
    if (start < nowInBr) {
      return res.status(400).json({ error: 'Não é possível realizar agendamentos em horários passados.' });
    }

    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ error: 'Serviço não encontrado.' });

    const end = new Date(start.getTime() + service.durationInMinutes * 60000);

    const hasConflict = await Appointment.findOne({
      companyId,
      professionalId,
      status: { $ne: 'canceled' },
      $or: [
        { startTime: { $lt: end }, endTime: { $gt: start } }
      ]
    });

    if (hasConflict) {
      return res.status(400).json({ error: 'Este profissional já possui um agendamento neste horário.' });
    }

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
    return res.status(200).json({ success: true, staff: staffList });
  } catch (e) { return res.status(200).json({ staff: [] }); }
});

app.get('/api/services/list-by-company', async (req, res) => {
  try {
    const { companyId } = req.query;
if (!companyId) return res.status(400).json({ error: 'companyId obrigatório.' });
const services = await Service.find({ companyId, isActive: true });
return res.status(200).json({ success: true, services: services });
} catch (e) { return res.status(200).json({ services: [] }); }
});
export default app;