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
app.get('/api/appointments/list', async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'O parâmetro companyId é obrigatório.' });
    const appointments = await Appointment.find({ companyId }).populate('customerId').populate('serviceId').populate('professionalId');
    return res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// NOVA ROTA: Atualizar status do agendamento (Concluir e Cancelar)
// Suporta tanto PUT quanto PATCH se o seu front usar um ou outro
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
// NOVA ROTA: Listar profissionais requisitada pelo seu frontend
app.get('/api/staff/list-by-company', async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'O parâmetro companyId é obrigatório.' });

    const staffList = await Staff.find({ companyId, isActive: true }).populate('specialties');
    return res.status(200).json({ success: true, data: staffList });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// NOVA ROTA: Caso seu front chame alternativamente por 'get-users'
app.get('/api/staff/get-users', async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'O parâmetro companyId é obrigatório.' });
    const staffList = await Staff.find({ companyId, isActive: true }).populate('specialties');
    return res.status(200).json({ success: true, data: staffList });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});


// ==========================================
// ROTAS DE SERVIÇOS (SERVICES)
// ==========================================
// NOVA ROTA: Listar serviços requisitada pelo seu frontend
app.get('/api/services/list-by-company', async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'O parâmetro companyId é obrigatório.' });

    const services = await Service.find({ companyId, isActive: true });
    return res.status(200).json({ success: true, data: services });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default app;
