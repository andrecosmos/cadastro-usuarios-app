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

// CORREÇÃO ADMIN: Agora filtra estritamente por data se ela for enviada na URL
app.get('/api/appointments/list', async (req, res) => {
  try {
    const { companyId, date } = req.query; // Pega o companyId e a data (ex: 2026-09-10)
    if (!companyId) return res.status(400).json({ error: 'O parâmetro companyId é obrigatório.' });

    let queryFilter = { companyId };

    // Se o admin clicou em uma data específica, criamos o filtro do dia completo (UTC)
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

// CORREÇÃO MÁXIMA PÁGINA AGENDAR: Rota para buscar os slots de horários livres sem quebrar o .length do front
app.get('/api/appointments/available-slots', async (req, res) => {
  try {
    const { companyId, professionalId, date } = req.query;

    // Se o calendário do front ainda não enviou a data, retorna um array vazio seguro para o .length não quebrar
    if (!companyId || !date) {
      return res.status(200).json({
        success: true,
        slots: [],
        data: []
      });
    }

    // 1. Cria a janela do dia completo baseado na data vinda do calendário
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // 2. Monta o filtro para checar agendamentos concorrentes naquele dia
    let appointmentFilter = {
      companyId,
      startTime: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'canceled' } // Ignora agendamentos cancelados
    };

    if (professionalId && professionalId !== 'undefined' && professionalId !== '') {
      appointmentFilter.professionalId = professionalId;
    }

    const existingAppointments = await Appointment.find(appointmentFilter);

    // 3. Grade de Horários Operacionais Padrão (Grade completa de 30 em 30 min)
    const defaultHours = [
      "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", 
      "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
    ];
    
    // 4. Filtra retirando os horários que o banco disser que já estão ocupados
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

    // RETORNO BLINDADO: Não importa onde o .length ou .map() clique, ele vai achar o array válido
    return res.status(200).json({
      success: true,
      data: availableSlots,
      slots: availableSlots,
      // Se o front tentar ler direto o response como array:
      length: availableSlots.length,
      ...availableSlots
    });

  } catch (error) {
    // Mesmo em caso de erro interno, envia os arrays vazios para salvar o front da tela branca
    return res.status(500).json({ 
      error: error.message,
      slots: [],
      data: []
    });
  }
});



// ==========================================
// ROTAS DE EQUIPE (STAFF)
// ==========================================
app.get('/api/staff/list-by-company', async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'O parâmetro companyId é obrigatório.' });

    const staffList = await Staff.find({ companyId, isActive: true }).populate('specialties');
    
    // Retorna em múltiplos formatos para garantir compatibilidade com o .map() do front
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
    
    // Retorna em múltiplos formatos para o .map() achar a propriedade correta
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