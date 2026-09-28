import express from 'express';
import { connectToDatabase } from './_config/database.js';
import { Company } from './_models/Company.js';

import { Appointment } from './_models/Appointment.js';
import { Service } from './_models/Service.js';
import { Staff } from './_models/Staff.js';
//  Forma correta para exportações default:
// Altere para importar COM as chaves novamente:
import { User } from './_models/User.js';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
app.use(cors()); // Libera o acesso para o seu frontend local se conectar
app.use(express.json())

// Middleware de conexão direta com o banco de dados
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Erro de banco: ' + error.message });
  }
});


// Função para transformar a senha em uma hash segura baseada em SHA-256
function gerarSenhaCriptografada(senhaTextoPuro) {
  if (!senhaTextoPuro) return '';
  return crypto.createHash('sha256').update(senhaTextoPuro).digest('hex');
}





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

app.patch('/api/companies/update', async (req, res) => {
  try {
    const { companyId, name, phone } = req.body;
    if (!companyId) return res.status(400).json({ error: 'companyId obrigatório.' });

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
    }

    const company = await Company.findByIdAndUpdate(companyId, updateData, { new: true });
    if (!company) return res.status(404).json({ error: 'Empresa não encontrada.' });

    return res.status(200).json({ success: true, company });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ==========================================
// ROTA: CADASTRAR CLIENTE PELO PAINEL ADMIN
// ==========================================
// ROTA: CADASTRAR CLIENTE PELO PAINEL ADMIN (BLINDADA)
// ==========================================
app.post('/api/customers/create', async (req, res) => {
  try {
    const { companyId, nome, email, telefone } = req.body;

    // Log para ver exatamente o que o admin disparou da tela
    console.log("➡️ DISPARO DE CRIAÇÃO DE CLIENTE ADMIN:", req.body);
    console.log("Alvo de persistência física na coleção:", User.collection.name);

    if (!companyId || !nome || !telefone) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
    }

    if (email) {
      const clienteExiste = await User.findOne({ companyId, email });
      if (clienteExiste) {
        return res.status(400).json({ error: 'Um usuário com este e-mail já está cadastrado.' });
      }
    }

    const senhaInicial = telefone.replace(/\D/g, ''); // Ex: "11993001129"
    const senhaInicialCriptografada = gerarSenhaCriptografada(senhaInicial);

    // 🌟 FORÇANDO A CRIAÇÃO DE UM DOCUMENTO INSTANCIADO
    const novoClienteDoc = new User({
      companyId,
      nome,
      email: email || `${senhaInicial}@temporario.com`,
      telefone,
      senha: senhaInicialCriptografada,
      role: 'user'
    });

    // 🌟 FORÇA A GRAVAÇÃO FÍSICA NO BANCO (com await .save())
    // Se o banco rejeitar por falta de conexão, o bloco catch captura na hora!
    const clienteSalvo = await novoClienteDoc.save();

    console.log("✅ CONFIRMAÇÃO DE SALVAMENTO FÍSICO NO BANCO:", clienteSalvo);

    return res.status(201).json({ 
      success: true, 
      message: 'Cliente cadastrado com sucesso!', 
      data: clienteSalvo 
    });

  } catch (e) { 
    console.error("💥 ERRO FATAL AO TENTAR PERSISTIR CLIENTE:", e);
    return res.status(500).json({ error: 'Erro ao salvar cliente: ' + e.message }); 
  }
});


// ==========================================
// ROTAS: APPOINTMENTS (LISTAGEM FILTRADA POR DATA CORRIGIDA)
// ==========================================
app.get('/api/appointments/list', async (req, res) => {
  try {
    const { companyId, date } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId obrigatório.' });

    let queryFilter = { companyId };

    // Correção do filtro de data e fuso horário
    if (date) {
      // Cria a data usando o horário local do início e fim do dia
      const startOfDay = new Date(`${date}T00:00:00`);
      const endOfDay = new Date(`${date}T23:59:59.999`);

      // 🌟 CORREÇÃO DA SINTAXE: Operadores nativos do MongoDB (gte e lte) sem caracteres estranhos
      queryFilter.startTime = { 
        $gte: startOfDay, $lte: endOfDay 
      };
      
      console.log(`🔍 Filtrando agendamentos entre: ${startOfDay.toISOString()} e ${endOfDay.toISOString()}`);
    }

    const appointments = await Appointment.find(queryFilter)
      .populate({
        path: 'customerId',
        model: User // Força o Mongoose a ler a tabela unificada de 'usuarios'
      })
      .populate('serviceId')
      .populate('professionalId')
      .lean();

    return res.status(200).json({
      success: true,
      data: appointments
    });
  } catch (e) { 
    console.error("Erro ao listar agendamentos por data:", e);
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

    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    const existingAppointments = await Appointment.find({
      companyId,
      professionalId,
      startTime: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'canceled' }
    });

    const defaultHours = [
      "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", 
      "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
    ];
    
    const slotsFormatted = defaultHours
      .filter(time => {
        const isOccupied = existingAppointments.some(app => {
          const appTime = new Date(app.startTime).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', minute: '2-digit', timeZone: 'UTC' 
          });
          return appTime === time;
        });
        return !isOccupied;
      })
      .map(time => {
        const dateTimeIso = new Date(`${date}T${time}:00`).toISOString();
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

app.post('/api/appointments/create', async (req, res) => {
  try {
    const { companyId, customerId, professionalId, serviceId, startTime } = req.body;
    
    // Log de segurança para debugar no seu VS Code se algum ID sumir
    console.log("➡️ TENTATIVA DE AGENDAMENTO RECEBIDA:", req.body);

    if (!companyId || !customerId || !professionalId || !serviceId || !startTime) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes para o agendamento.' });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ error: 'Serviço não encontrado.' });
    }

    const start = new Date(startTime);
    const end = new Date(start.getTime() + service.durationInMinutes * 60000);

    const newAppointment = await Appointment.create({
      companyId, 
      customerId, // Este ID agora aponta para o _id do Andrade ou do cliente na tabela de usuários
      professionalId, 
      serviceId,
      startTime: start, 
      endTime: end, 
      status: 'pending', 
      paymentStatus: 'unpaid'
    });

    return res.status(201).json({ success: true, message: 'Agendamento com sucesso!', data: newAppointment });
  } catch (e) { 
    console.error("Erro ao criar agendamento:", e);
    return res.status(500).json({ error: e.message }); 
  }
});


// ==========================================
// ROTAS: UPDATE STATUS (PATCH - EXATAMENTE COMO SEU SERVICE ACESSA)
// ==========================================
app.patch('/api/appointments/update-status', async (req, res) => {
  try {
    const { appointmentId, status } = req.body;
    if (!appointmentId || !status) return res.status(400).json({ error: 'Campos ausentes.' });

    const updated = await Appointment.findByIdAndUpdate(appointmentId, { status }, { new: true });
    if (!updated) return res.status(404).json({ error: 'Não encontrado.' });
    return res.status(200).json({ success: true, data: updated });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// ==========================================
// ROTAS: STAFF & SERVICES
// ==========================================
app.get('/api/staff/list-by-company', async (req, res) => {
  try {
    const { companyId } = req.query;
    const staffList = await Staff.find({ companyId, isActive: true }).populate('specialties');
    return res.status(200).json({ success: true, staff: staffList });
  } catch (e) { return res.status(200).json({ staff: [] }); }
});

//app.get('/api/services/list-by-company', async (req, res) => {
 // try {
 //   const { companyId } = req.query;
  //  const services = await Service.find({ companyId, isActive: true });
  //  return res.status(200).json({ success: true, services: services });
 // } catch (e) { return res.status(200).json({ services: [] }); }
//});
// ==========================================
// ROTA: LISTAR SERVIÇOS POR EMPRESA
// ==========================================
app.get('/api/services/list-by-company', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: 'companyId é obrigatório.' });
    }

    // Busca apenas os serviços ativos vinculados àquela empresa
    const servicesList = await Service.find({ companyId, isActive: true }).lean();

    return res.status(200).json({
      success: true,
      services: servicesList
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});


app.post('/api/services/create', async (req, res) => {
  try {
    const { companyId, name, description, durationInMinutes, price } = req.body;
    if (!companyId || !name || !durationInMinutes) {
      return res.status(400).json({ error: 'Empresa, nome e duração são obrigatórios.' });
    }

    const newService = await Service.create({
      companyId,
      name,
      description: description || '',
      durationInMinutes: parseInt(durationInMinutes, 10),
      price: parseFloat(price) || 0,
      isActive: true
    });

    return res.status(201).json({ success: true, data: newService });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// ==========================================
// ROTA: CRIAR PROFISSIONAL (STAFF)
// ==========================================
app.post('/api/staff/create', async (req, res) => {
  try {
    const { companyId, name, email, specialties } = req.body;

    if (!companyId || !name) {
      return res.status(400).json({ error: 'Empresa e nome do profissional são obrigatórios.' });
    }

    const newStaff = await Staff.create({
      companyId,
      name,
      email: email || '',
      specialties: specialties || [], // Array de IDs de serviços cadastrados
      isActive: true
    });

    return res.status(201).json({
      success: true,
      message: 'Profissional cadastrado com sucesso!',
      data: newStaff
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});


// ==========================================
// ROTA DE AUTENTICAÇÃO COM USUÁRIO FANTASMA
// ==========================================
// ROTA DE LOGIN PROTEGIDA COM ISOLAMENTO (MULTITENANCY)
// ==========================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, companySlug } = req.body;
    const password = req.body.password || req.body.senha;

    if (!email || !password) {
      return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
    }

    // 1. IGNORA FILTRO SE FOR O USUÁRIO FANTASMA ADMINISTRATIVO GLOBAL
    if (email === 'teste@admin.com' && password === '123456') {
      return res.status(200).json({
        success: true,
        token: `mock-token-fantasma-${Date.now()}`,
        user: { _id: "6aa063fbb68397d9ee19d588", name: "Admin Global", email, role: "admin", companySlug: "admin-global" }
      });
    }

    let usuario = null;
    let slugResolvido = companySlug;

    // 🌟 NOVA LÓGICA: Se NÃO vier o companySlug, é um Login Centralizado vindo da Landing Page
    if (!companySlug) {
      // Busca o usuário de forma global na tabela pelo e-mail
      usuario = await User.findOne({ email }).lean();
      
      if (!usuario) {
        return res.status(401).json({ message: 'Usuário não cadastrado no sistema.' });
      }

      // Busca a empresa associada ao ID que está gravado no cadastro do usuário encontrado
      const empresaVinc = await Company.findById(usuario.companyId);
      if (!empresaVinc) {
        return res.status(404).json({ message: 'Empresa vinculada a este usuário não foi encontrada.' });
      }
      
      // Armazena o slug da empresa que descobrimos no banco global
      slugResolvido = empresaVinc.slug;

    } else {
      // 🌟 LÓGICA ANTERIOR PRESERVADA: Login tradicional vindo de dentro de um estabelecimento (/slug/login)
      const empresa = await Company.findOne({ slug: companySlug });
      if (!empresa) {
        return res.status(404).json({ message: 'Estabelecimento não encontrado.' });
      }

      // Busca garantindo o escopo restrito da empresa
      usuario = await User.findOne({ email, companyId: empresa._id }).lean();
      if (!usuario) {
        return res.status(401).json({ message: 'Usuário não cadastrado neste estabelecimento.' });
      }
    }

    // 4. VERIFICAÇÃO DE SENHA (Igual para ambos os fluxos)
    const senhaDigitadaHash = gerarSenhaCriptografada(password);

    if (usuario.senha !== senhaDigitadaHash) {
      return res.status(401).json({ message: 'E-mail ou senha incorretos.' });
    }

    // 5. RETORNA DADOS COM SUCESSO INJETANDO O SLUG RESOLVIDO
    return res.status(200).json({
      success: true,
      token: `mock-token-${usuario._id}-${Date.now()}`,
      user: {
        ...usuario,
        name: usuario.nome, // Garante compatibilidade de chaves com o front
        companySlug: slugResolvido // 🌟 Crucial para o React saber para onde redirecionar!
      }
    });

  } catch (e) {
    return res.status(500).json({ message: 'Erro interno no servidor: ' + e.message });
  }
});


// ==========================================
// ROTA PÚBLICA: CADASTRO DE CLIENTE (USUÁRIO COMUM)
// ==========================================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { companyId, nome, email, senha, telefone } = req.body;

    if (!companyId || !nome || !email || !senha) {
      return res.status(400).json({ message: 'Empresa, nome, e-mail e senha são obrigatórios.' });
    }

    const usuarioExiste = await User.findOne({ companyId, email });
    if (usuarioExiste) {
      return res.status(400).json({ message: 'Este e-mail já está cadastrado neste estabelecimento.' });
    }

    // 🌟 CRIPTOGRAFIA ATIVADA: Transforma a senha em hash antes de salvar
    const senhaCriptografada = gerarSenhaCriptografada(senha);

    const novoUsuario = await User.create({
      companyId,
      nome,
      email,
      senha: senhaCriptografada, // Salva a hash estável no banco
      telefone: telefone || '',
      role: 'user'
    });

    const token = `mock-token-${novoUsuario._id}-${Date.now()}`;

    return res.status(201).json({
      success: true,
      token,
      user: { _id: novoUsuario._id, name: novoUsuario.nome, email: novoUsuario.email, role: novoUsuario.role }
    });

  } catch (e) {
    return res.status(500).json({ message: 'Erro ao criar conta: ' + e.message });
  }
});


export default app;
