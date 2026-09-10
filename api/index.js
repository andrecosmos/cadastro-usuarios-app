import express from 'express';
import { connectToDatabase } from './_config/database.js';
import { Company } from './_models/Company.js';
import { Customer } from './_models/Customer.js';
import { Appointment } from './_models/Appointment.js';
import { Service } from './_models/Service.js';
import { Staff } from './_models/Staff.js';

const app = express();
app.use(express.json());

// Middleware para garantir conexão com o banco em todas as rotas
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    res.status(500).json({ error: 'Erro de conexão com o banco: ' + error.message });
  }
});

// Função auxiliar para gerar Slug
function generateSlug(text) {
  return text.toString().toLowerCase().trim().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-').replace(/-+/g, '-');
}

// ==========================================
// ROTAS DE COMPANHIAS (COMPANIES)
// ==========================================
app.post('/api/companies/create', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email || !phone) return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
    
    const slug = generateSlug(name);
    const companyExists = await Company.findOne({ $or: [{ email }, { slug }] });
    if (companyExists) return res.status(400).json({ error: 'Empresa já cadastrada.' });

    const newCompany = await Company.create({ name, slug, email, phone, planStatus: 'trial' });
    return res.status(201).json({ success: true, data: newCompany });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/companies/get-by-slug', async (req, res) => {
  try {
    const { slug } = req.query;
    if (!slug) return res.status(400).json({ error: 'O parâmetro slug é obrigatório.' });
    const company = await Company.findOne({ slug });
    if (!company) return res.status(404).json({ error: 'Estabelecimento não encontrado.' });
    return res.status(200).json({ success: true, company });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ROTAS DE CLIENTES (CUSTOMERS)
// ==========================================
app.post('/api/customers/create', async (req, res) => {
  try {
    const { companyId, name, email, phone } = req.body;
    if (!companyId || !name || !phone) return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
    const newCustomer = await Customer.create({ companyId, name, email, phone });
    return res.status(201).json({ success: true, data: newCustomer });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ROTAS DE AGENDAMENTOS (APPOINTMENTS)
// ==========================================

// Listar agendamentos com filtro por data para o Admin
app.get('/api/appointments/list', async (req, res) => {
  try {
    const { companyId, date } = req.query;
    if (!companyId) return res.status(400).json({ error: 'O parâmetro companyId é obrigatório.' });

    let queryFilter = { companyId };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setUTCHours(23, 59, 59, 999);

      queryFilter.startTime = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    const appointments = await Appointment.find(queryFilter)
      .populate('customerId')
      .populate('serviceId')
      .populate('professionalId');

    return res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Buscar slots de horários livres para a página de agendamento
app.get('/api/appointments/available-slots', async (req, res) => {
  try {
    const { companyId, professionalId, date } = req.query;

    if (!companyId || !date) {
      return res.status(200).json({
        success: true,
        slots: [],
        data: []
      });
    }

    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

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
    
    const availableSlots = defaultHours.filter(time => {
      return !existingAppointments.some(app => {
        const appTime = new Date(app.startTime).toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit', 
          timeZone: 'UTC' 
        });
        return appTime === time;
      });
    });

    return res.status(200).json({
      success: true,
      data: availableSlots,
      slots: availableSlots,
      length: availableSlots.length
    });

  } catch (error) {
    return res.status(500).json({ 
      error: error.message,
      slots: [],
      data: []
    });
  }
});

// Atualizar status do agendamento (Botões Concluir e Cancelar do Admin)
const handleUpdateStatus = async (req, res) => {
  try {
    const { appointmentId, status } = req.body;
    if (!appointmentId || !status) return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });

    const updated = await Appointment.findByIdAndUpdate(
      appointmentId,
      { status },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Agendamento não encontrado.' });
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
app.put('/api/appointments/update-status', handleUpdateStatus);
app.patch('/api/appointments/update-status', handleUpdateStatus);


// ==========================================
// ROTAS DE EQUIPE (STAFF)
// ==========================================
app.get('/api/staff/list-by-company', async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'O parâmetro companyId é obrigatório.' });

    const staffList = await Staff.find({ companyId, isActive: true }).populate('specialties');
    
    return res.status(200).json({ 
      success: true, 
      data: staffList,
      staff: staffList,
      staffList: staffList
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/staff/get-users', async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'O parâmetro companyId é obrigatório.' });

    const staffList = await Staff.find({ companyId, isActive: true }).populate('specialties');
    return res.status(200).json({ 
      success: true, 
      data: staffList,
      staff: staffList
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});


// ==========================================
// ROTAS DE SERVIÇOS (SERVICES)
// ==========================================
app.get('/api/services/list-by-company', async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'O parâmetro companyId é obrigatório.' });

    const services = await Service.find({ companyId, isActive: true });
    
    return res.status(200).json({ 
      success: true, 
      data: services,
      services: services
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default app;
