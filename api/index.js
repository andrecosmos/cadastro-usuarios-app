import express from 'express';
import { connectToDatabase } from './_config/database.js';
import { MercadoPagoConfig, Payment as MPPayment, Preference } from 'mercadopago';

import { Company } from './_models/Company.js';
import { Appointment } from './_models/Appointment.js';
import { Service } from './_models/Service.js';
import { Staff } from './_models/Staff.js';
import { User } from './_models/User.js';


import cors from 'cors';
import crypto from 'crypto';
import { Buffer } from 'node:buffer';
import bcrypt from 'bcryptjs';
import process from 'node:process';
import {
  authenticate,
  createAccessToken,
  requireAdmin,
  requireCompanyScope,
  requireCustomer
} from './_middleware/auth.js';

import mongoose from 'mongoose'; // 🌟 Correção para ES Modules ("type": "module")
import {
  formatBusinessTime,
  getBusinessDayBounds,
  toBusinessDateTimeIso
} from '../shared/dateTime.js';


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

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function verifyAndUpgradePassword(user, password) {
  const storedPassword = user.senha || '';

  if (/^\$2[aby]\$/.test(storedPassword)) {
    return bcrypt.compare(password, storedPassword);
  }

  const legacyHash = gerarSenhaCriptografada(password);
  const providedBuffer = Buffer.from(legacyHash);
  const storedBuffer = Buffer.from(storedPassword);
  const matches = providedBuffer.length === storedBuffer.length &&
    crypto.timingSafeEqual(providedBuffer, storedBuffer);

  if (!matches) return false;

  const upgradedHash = await hashPassword(password);
  await User.updateOne({ _id: user._id }, { $set: { senha: upgradedHash } });
  return true;
}





function generateSlug(text) {
  return text.toString().toLowerCase().trim().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-').replace(/-+/g, '-');
}

const appointmentStartTimes = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getBusinessDate(value) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(value);
  const dateParts = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));

  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
}

function getPublicAppUrl() {
  const configuredUrl = process.env.PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

  if (!configuredUrl) {
    throw new Error('PUBLIC_APP_URL ausente. Configure a origem HTTPS pública da aplicação; localhost não recebe webhooks do Mercado Pago.');
  }

  let appUrl;
  try {
    appUrl = new URL(configuredUrl);
  } catch {
    throw new Error('PUBLIC_APP_URL inválida. Informe apenas a origem HTTPS pública, sem caminho.');
  }
  if (appUrl.protocol !== 'https:') {
    throw new Error('PUBLIC_APP_URL deve ser HTTPS e acessível publicamente; localhost não recebe webhooks do Mercado Pago.');
  }

  return appUrl.origin;
}

function getCompanyResponse(company, mercadoPagoConfigured) {
  const companyData = company.toObject ? company.toObject() : { ...company };
  if (companyData.settings) {
    delete companyData.settings.mercadoPagoAccessToken;
  }
  companyData.settings = {
    ...companyData.settings,
    mercadoPagoConfigured
  };
  return companyData;
}

function activeAppointmentFilter(now = new Date()) {
  return {
    status: { $ne: 'canceled' },
    $or: [
      { status: { $ne: 'pending' } },
      { paymentStatus: 'paid' },
      { paymentExpiresAt: { $exists: false } },
      { paymentExpiresAt: null },
      { paymentExpiresAt: { $gt: now } }
    ]
  };
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
    const company = await Company.findOne({ slug }).lean();
    if (!company) return res.status(404).json({ error: 'Não encontrado.' });
    const mercadoPagoConfigured = await Company.exists({
      _id: company._id,
      'settings.mercadoPagoAccessToken': { $type: 'string', $ne: '' }
    });
    return res.status(200).json({
      success: true,
      company: getCompanyResponse(company, Boolean(mercadoPagoConfigured))
    });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});


// Rota para atualizar informações das empresas (Versão com Banner e Logo)
app.patch('/api/companies/update', authenticate, requireAdmin, requireCompanyScope, async (req, res) => {
  try {
    // 1. Incluímos bannerUrl e logoUrl na desestruturação do corpo da requisição
    const { 
      name, 
      phone, 
      mercadoPagoAccessToken, 
      clearMercadoPagoAccessToken,
      bannerUrl,
      logoUrl
    } = req.body;
    
    const companyId = req.auth.companyId;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;

    // --- NOVAS VALIDAÇÕES PARA AS IMAGENS ---
    // Validamos se são strings legítimas antes de salvar para evitar sujeira no banco
    if (bannerUrl !== undefined) {
      if (typeof bannerUrl !== 'string' || !bannerUrl.trim()) {
        return res.status(400).json({ error: 'A URL do banner informada é inválida.' });
      }
      updateData.bannerUrl = bannerUrl.trim();
    }

    if (logoUrl !== undefined) {
      if (typeof logoUrl !== 'string' || !logoUrl.trim()) {
        return res.status(400).json({ error: 'A URL da logo informada é inválida.' });
      }
      updateData.logoUrl = logoUrl.trim();
    }
    // ----------------------------------------

    // Valitações do Mercado Pago (Mantidas idênticas ao seu original)
    if (clearMercadoPagoAccessToken !== undefined && typeof clearMercadoPagoAccessToken !== 'boolean') {
      return res.status(400).json({ error: 'A opção de remover o token do Mercado Pago é inválida.' });
    }
    if (clearMercadoPagoAccessToken && mercadoPagoAccessToken !== undefined) {
      return res.status(400).json({ error: 'Informe um novo token ou solicite a remoção, não ambos.' });
    }
    if (mercadoPagoAccessToken !== undefined) {
      if (
        typeof mercadoPagoAccessToken !== 'string' ||
        !mercadoPagoAccessToken.trim() ||
        mercadoPagoAccessToken.trim().length > 1000
      ) {
        return res.status(400).json({ error: 'O token do Mercado Pago informado é inválido.' });
      }
      updateData['settings.mercadoPagoAccessToken'] = mercadoPagoAccessToken.trim();
    } else if (clearMercadoPagoAccessToken) {
      updateData['settings.mercadoPagoAccessToken'] = null;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
    }

    // O findByIdAndUpdate já vai aplicar as novas URLs se elas existirem no updateData
    await Company.findByIdAndUpdate(companyId, updateData, { returnDocument: 'after' });
    
    const company = await Company.findById(companyId)
      .select('+settings.mercadoPagoAccessToken');
    if (!company) return res.status(404).json({ error: 'Empresa não encontrada.' });

    const mercadoPagoConfigured = Boolean(company.settings?.mercadoPagoAccessToken);
    
    return res.status(200).json({
      success: true,
      company: getCompanyResponse(company, mercadoPagoConfigured)
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});


// ==========================================
// ROTA: CADASTRAR CLIENTE PELO PAINEL ADMIN
// ==========================================

app.post('/api/customers/create', authenticate, requireAdmin, requireCompanyScope, async (req, res) => {
  try {
    const { nome, email, telefone } = req.body;
    const companyId = req.auth.companyId;

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
    const senhaInicialCriptografada = await hashPassword(senhaInicial);

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

app.get('/api/customers/search', authenticate, requireAdmin, requireCompanyScope, async (req, res) => {
  try {
    const companyId = req.auth.companyId;
    const searchTerm = String(req.query.q || '').trim();

    if (searchTerm.length === 1) {
      return res.status(200).json({ success: true, customers: [] });
    }

    const searchFilter = searchTerm
      ? {
          $or: ['nome', 'email', 'telefone'].map((field) => ({
            [field]: { $regex: escapeRegExp(searchTerm), $options: 'i' }
          }))
        }
      : {};

    const customers = await User.find({
      companyId,
      role: 'user',
      ...searchFilter
    })
      .select('_id nome email telefone')
      .sort({ nome: 1 })
      .limit(20)
      .lean();

    return res.status(200).json({ success: true, customers });
  } catch (e) {
    console.error('Erro ao buscar clientes da empresa:', e);
    return res.status(500).json({ error: 'Não foi possível buscar os clientes.' });
  }
});


// ==========================================
// ROTAS: APPOINTMENTS (LISTAGEM FILTRADA POR DATA CORRIGIDA)
// ==========================================
app.get('/api/appointments/list', authenticate, requireAdmin, requireCompanyScope, async (req, res) => {
  try {
    const { date } = req.query;
    const companyId = req.auth.companyId;

    let queryFilter = { companyId };

    // Correção do filtro de data e fuso horário
    if (date) {
      const { start, endExclusive } = getBusinessDayBounds(date);
      queryFilter.startTime = {
        $gte: start,
        $lt: endExclusive
      };
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
    const { companyId, professionalId, serviceId, date } = req.query;

    if (
      !mongoose.isValidObjectId(companyId) ||
      !mongoose.isValidObjectId(professionalId) ||
      !mongoose.isValidObjectId(serviceId) ||
      !date
    ) {
      return res.status(400).json({ error: 'Empresa, profissional, serviço e data válidos são obrigatórios.' });
    }

    const [service, professional] = await Promise.all([
      Service.findOne({ _id: serviceId, companyId, isActive: true }).lean(),
      Staff.findOne({ _id: professionalId, companyId, isActive: true }).lean()
    ]);

    if (!service || !professional) {
      return res.status(404).json({ error: 'Serviço ou profissional não encontrado para esta empresa.' });
    }

    const durationInMinutes = Number(service.durationInMinutes);
    if (!Number.isFinite(durationInMinutes) || durationInMinutes <= 0) {
      return res.status(400).json({ error: 'A duração do serviço é inválida.' });
    }

    const { start, endExclusive } = getBusinessDayBounds(date);
    const closingTime = new Date(toBusinessDateTimeIso(date, '18:00'));

    const existingAppointments = await Appointment.find({
      companyId,
      professionalId,
      ...activeAppointmentFilter(),
      startTime: { $lt: endExclusive },
      endTime: { $gt: start }
    }).lean();

    const slotsFormatted = appointmentStartTimes
      .map((time) => {
        const slotStart = new Date(toBusinessDateTimeIso(date, time));
        const slotEnd = new Date(slotStart.getTime() + durationInMinutes * 60000);
        const isOccupied = existingAppointments.some((appointment) =>
          slotStart < new Date(appointment.endTime) &&
          slotEnd > new Date(appointment.startTime)
        );

        return {
          time,
          dateTimeIso: slotStart.toISOString(),
          isAvailable: !isOccupied && slotStart > new Date() && slotEnd <= closingTime
        };
      })
      .filter((slot) => slot.isAvailable)
      .map(({ time, dateTimeIso }) => ({ time, dateTimeIso }));

    return res.status(200).json({
      success: true,
      availableSlots: slotsFormatted
    });
  } catch (e) {
    if (e instanceof RangeError) {
      return res.status(400).json({ error: 'Data inválida.' });
    }
    console.error('Erro ao consultar horários disponíveis:', e);
    return res.status(500).json({ error: 'Não foi possível consultar os horários disponíveis.' });
  }
});


//Rota de Criação de Agendamento
app.post('/api/appointments/create', authenticate, requireCompanyScope, async (req, res) => {
  try {
    const { companyId, customerId, professionalId, serviceId, startTime } = req.body;

    if (
      !mongoose.isValidObjectId(companyId) ||
      !mongoose.isValidObjectId(customerId) ||
      !mongoose.isValidObjectId(professionalId) ||
      !mongoose.isValidObjectId(serviceId) ||
      !startTime
    ) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes para o agendamento.' });
    }

    if (!['admin', 'user'].includes(req.auth.role)) {
      return res.status(403).json({ error: 'Acesso ao agendamento negado.' });
    }

    if (req.auth.role === 'user' && customerId !== req.auth.userId) {
      return res.status(403).json({ error: 'Clientes só podem criar agendamentos para si mesmos.' });
    }

    const [customer, service, professional] = await Promise.all([
      User.findOne({ _id: customerId, companyId, role: 'user' }).select('_id email nome').lean(),
      Service.findOne({ _id: serviceId, companyId, isActive: true }).lean(),
      Staff.findOne({ _id: professionalId, companyId, isActive: true }).select('_id').lean()
    ]);

    if (!customer) {
      return res.status(404).json({ error: 'Cliente não encontrado para esta empresa.' });
    }
    if (!service) {
      return res.status(404).json({ error: 'Serviço não encontrado ou inativo para esta empresa.' });
    }
    if (!professional) {
      return res.status(404).json({ error: 'Profissional não encontrado ou inativo para esta empresa.' });
    }

    let checkoutConfiguration = null;
    if (req.auth.role === 'user') {
      const company = await Company.findById(companyId)
        .select('+settings.mercadoPagoAccessToken')
        .lean();
      if (company?.settings?.mercadoPagoAccessToken) {
        try {
          const publicAppUrl = getPublicAppUrl();
          const webhookUrl = new URL('/api/webhooks/mercado-pago', publicAppUrl);
          webhookUrl.searchParams.set('companyId', String(company._id));

          checkoutConfiguration = {
            accessToken: company.settings.mercadoPagoAccessToken,
            companyName: company.name,
            companySlug: company.slug,
            publicAppUrl,
            notificationUrl: webhookUrl.href
          };
        } catch (error) {
          console.warn('Checkout indisponível para este agendamento; pagamento poderá ser feito no estabelecimento:', error.message);
        }
      }
    }

    const start = new Date(startTime);
    const durationInMinutes = Number(service.durationInMinutes);
    const paymentAmount = Number(service.price);
    if (
      Number.isNaN(start.getTime()) ||
      !Number.isFinite(durationInMinutes) ||
      durationInMinutes <= 0 ||
      (req.auth.role === 'user' && (!Number.isFinite(paymentAmount) || paymentAmount <= 0))
    ) {
      return res.status(400).json({ error: 'Data, horário, duração ou preço do serviço inválidos.' });
    }

    const businessDate = getBusinessDate(start);
    const businessTime = formatBusinessTime(start);
    if (
      !appointmentStartTimes.includes(businessTime) ||
      start.getUTCSeconds() !== 0 ||
      start.getUTCMilliseconds() !== 0
    ) {
      return res.status(400).json({ error: 'O horário solicitado não está disponível para agendamento.' });
    }

    const { start: dayStart } = getBusinessDayBounds(businessDate);
    const end = new Date(start.getTime() + durationInMinutes * 60000);
    const closingTime = new Date(toBusinessDateTimeIso(businessDate, '18:00'));

    if (start < dayStart || end > closingTime) {
      return res.status(400).json({ error: 'O serviço ultrapassa o horário de atendimento.' });
    }

    const bookingLockToken = crypto.randomUUID();
    const lockTime = new Date();
    const lockExpiresAt = new Date(lockTime.getTime() + 60_000);
    const lockedProfessional = await Staff.findOneAndUpdate(
      {
        _id: professionalId,
        companyId,
        isActive: true,
        $or: [
          { bookingLockUntil: { $exists: false } },
          { bookingLockUntil: { $lte: lockTime } }
        ]
      },
      {
        $set: {
          bookingLockToken,
          bookingLockUntil: lockExpiresAt
        }
      },
      { returnDocument: 'after' }
    ).select('+bookingLockToken').lean();

    if (!lockedProfessional) {
      return res.status(409).json({ error: 'Este profissional está confirmando outro agendamento. Tente novamente.' });
    }

    let newAppointment;
    let hasOverlap = false;

    try {
      hasOverlap = Boolean(await Appointment.exists({
        companyId,
        professionalId,
        ...activeAppointmentFilter(lockTime),
        startTime: { $lt: end },
        endTime: { $gt: start }
      }));

      if (!hasOverlap) {
        newAppointment = await Appointment.create({
          companyId,
          customerId,
          professionalId,
          serviceId,
          startTime: start,
          endTime: end,
          status: req.auth.role === 'user' ? 'confirmed' : 'pending',
          paymentStatus: 'unpaid',
          paymentAmount,
          paymentCurrency: 'BRL'
        });
      }
    } finally {
      await Staff.updateOne(
        { _id: professionalId, companyId, bookingLockToken },
        { $unset: { bookingLockToken: 1, bookingLockUntil: 1 } }
      );
    }

    if (hasOverlap) {
      return res.status(409).json({ error: 'Este horário acabou de ser ocupado. Escolha outro horário.' });
    }

    if (checkoutConfiguration) {
      const checkoutReturnUrl = new URL(`/${encodeURIComponent(checkoutConfiguration.companySlug)}`, checkoutConfiguration.publicAppUrl);
      const successUrl = new URL(checkoutReturnUrl);
      successUrl.searchParams.set('checkout_return', 'success');
      const pendingUrl = new URL(checkoutReturnUrl);
      pendingUrl.searchParams.set('checkout_return', 'pending');
      const failureUrl = new URL(checkoutReturnUrl);
      failureUrl.searchParams.set('checkout_return', 'failure');

      try {
        const preference = new Preference(new MercadoPagoConfig({
          accessToken: checkoutConfiguration.accessToken
        }));
        const preferenceResponse = await preference.create({
          body: {
            items: [{
              id: String(service._id),
              title: `${service.name} - ${checkoutConfiguration.companyName}`,
              quantity: 1,
              unit_price: paymentAmount,
              currency_id: 'BRL'
            }],
            payer: customer.email ? { email: customer.email } : undefined,
            external_reference: String(newAppointment._id),
            metadata: {
              appointment_id: String(newAppointment._id),
              company_id: String(companyId)
            },
            back_urls: {
              success: successUrl.toString(),
              pending: pendingUrl.toString(),
              failure: failureUrl.toString()
            },
            auto_return: 'approved',
            notification_url: checkoutConfiguration.notificationUrl.toString(),
          }
        });

        if (!preferenceResponse.id || !preferenceResponse.init_point) {
          throw new Error('Mercado Pago não retornou os dados necessários para o checkout.');
        }

        await Appointment.updateOne(
          { _id: newAppointment._id, companyId },
          {
            $set: {
              gatewayPreferenceId: String(preferenceResponse.id),
              gatewayCheckoutUrl: preferenceResponse.init_point
            }
          }
        );

        return res.status(201).json({
          success: true,
          message: 'Agendamento confirmado. Você pode pagar pelo checkout ou no estabelecimento.',
          checkoutUrl: preferenceResponse.init_point,
          data: newAppointment
        });
      } catch (error) {
        console.error(`Falha ao criar preferência do Mercado Pago; agendamento confirmado para pagamento no estabelecimento: ${error.message}`);
      }
    }

    return res.status(201).json({
      success: true,
      message: req.auth.role === 'user'
        ? 'Agendamento confirmado. O pagamento poderá ser feito no estabelecimento.'
        : 'Agendamento realizado com sucesso!',
      data: newAppointment
    });
  } catch (e) { 
    console.error("Erro ao criar agendamento:", e);
    if (e instanceof RangeError) {
      return res.status(400).json({ error: 'Data ou horário inválido.' });
    }
    return res.status(500).json({ error: e.message }); 
  }
});


// ==========================================
// ROTAS: UPDATE STATUS (PATCH - EXATAMENTE COMO SEU SERVICE ACESSA)
// ==========================================
app.patch('/api/appointments/update-status', authenticate, requireAdmin, requireCompanyScope, async (req, res) => {
  try {
    const { appointmentId, status } = req.body;
    if (!appointmentId || !status) return res.status(400).json({ error: 'Campos ausentes.' });
    if (!['pending', 'completed', 'canceled'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido.' });
    }

    const updated = await Appointment.findOneAndUpdate(
      { _id: appointmentId, companyId: req.auth.companyId },
      { status },
      { returnDocument: 'after', runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Não encontrado.' });
    return res.status(200).json({ success: true, data: updated });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});


// Rota para registrar pagamento presencial
app.patch('/api/appointments/record-payment', authenticate, requireAdmin, requireCompanyScope, async (req, res) => {
  try {
    const { appointmentId, method } = req.body;
    const allowedMethods = ['pix', 'cash', 'card'];
    if (!mongoose.isValidObjectId(appointmentId) || !allowedMethods.includes(method)) {
      return res.status(400).json({ error: 'Agendamento ou método de pagamento inválido.' });
    }

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      companyId: req.auth.companyId,
      status: { $in: ['pending', 'confirmed', 'completed'] },
      paymentStatus: { $ne: 'paid' }
    }).populate('serviceId');

    if (!appointment) {
      const existingAppointment = await Appointment.exists({
        _id: appointmentId,
        companyId: req.auth.companyId
      });
      return existingAppointment
        ? res.status(409).json({ error: 'Este agendamento já foi pago ou não aceita registro de pagamento.' })
        : res.status(404).json({ error: 'Agendamento não encontrado.' });
    }

    const receivedAmount = Number(appointment.paymentAmount ?? appointment.serviceId?.price);
    if (!Number.isFinite(receivedAmount) || receivedAmount <= 0) {
      return res.status(400).json({ error: 'O agendamento não possui um valor válido para registrar.' });
    }

    const updatedAppointment = await Appointment.findOneAndUpdate(
      {
        _id: appointmentId,
        companyId: req.auth.companyId,
        status: { $in: ['pending', 'confirmed', 'completed'] },
        paymentStatus: { $ne: 'paid' }
      },
      {
        $set: {
          paymentStatus: 'paid',
          paymentMethod: method,
          paymentReceivedAt: new Date(),
          paymentReceivedAmount: receivedAmount,
          paymentAmount: receivedAmount,
          paymentCurrency: 'BRL'
        }
      },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updatedAppointment) {
      return res.status(409).json({ error: 'O pagamento deste agendamento já foi registrado.' });
    }

    return res.status(200).json({ success: true, data: updatedAppointment });
  } catch (error) {
    console.error('Erro ao registrar pagamento presencial:', error);
    return res.status(500).json({ error: 'Não foi possível registrar o pagamento.' });
  }
});

app.get('/api/reports/summary', authenticate, requireAdmin, requireCompanyScope, async (req, res) => {
  try {
    const { from, to } = req.query;
    if (typeof from !== 'string' || typeof to !== 'string') {
      return res.status(400).json({ error: 'Informe as datas inicial e final do relatório.' });
    }

    let start;
    let endExclusive;
    try {
      start = getBusinessDayBounds(from).start;
      endExclusive = getBusinessDayBounds(to).endExclusive;
    } catch {
      return res.status(400).json({ error: 'O período informado é inválido.' });
    }
    if (start >= endExclusive) {
      return res.status(400).json({ error: 'A data inicial deve ser anterior ou igual à data final.' });
    }

    const companyId = new mongoose.Types.ObjectId(req.auth.companyId);
    const reportNow = new Date();
    const [appointmentCounts, receivedPayments] = await Promise.all([
      Appointment.aggregate([
        { $match: { companyId, createdAt: { $gte: start, $lt: endExclusive } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            attendanceEligible: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $in: ['$status', ['confirmed', 'completed']] },
                      { $lte: ['$endTime', reportNow] }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            attended: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ['$status', 'completed'] }, { $lte: ['$endTime', reportNow] }] },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]),
      Appointment.aggregate([
        {
          $match: {
            companyId,
            paymentStatus: 'paid',
            $or: [
              { paymentReceivedAt: { $gte: start, $lt: endExclusive } },
              {
                paymentReceivedAt: null,
                gatewayPaymentId: { $exists: true, $ne: null },
                updatedAt: { $gte: start, $lt: endExclusive }
              }
            ]
          }
        },
        {
          $group: {
            _id: {
              $ifNull: [
                '$paymentMethod',
                { $cond: [{ $ifNull: ['$gatewayPaymentId', false] }, 'mercado_pago', 'unknown'] }
              ]
            },
            count: { $sum: 1 },
            amount: {
              $sum: {
                $ifNull: ['$paymentReceivedAmount', '$paymentAmount']
              }
            }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const counts = Object.fromEntries(appointmentCounts.map(({ _id, count }) => [_id, count]));
    const created = appointmentCounts.reduce((total, item) => total + item.count, 0);
    const completed = counts.completed || 0;
    const canceled = counts.canceled || 0;
    const attendanceEligible = appointmentCounts.reduce((total, item) => total + item.attendanceEligible, 0);
    const attended = appointmentCounts.reduce((total, item) => total + item.attended, 0);
    const methods = receivedPayments.map(({ _id, count, amount }) => ({
      method: _id,
      count,
      amount: Math.round(amount * 100) / 100
    }));
    const revenue = methods.reduce((total, item) => total + item.amount, 0);

    return res.status(200).json({
      success: true,
      data: {
        appointments: {
          created,
          confirmed: counts.confirmed || 0,
          completed,
          canceled,
          cancellationRate: created ? canceled / created : 0,
          attendanceRate: attendanceEligible ? attended / attendanceEligible : 0
        },
        payments: {
          receivedAmount: Math.round(revenue * 100) / 100,
          receivedCount: methods.reduce((total, item) => total + item.count, 0),
          byMethod: methods
        },
        period: { from, to }
      }
    });
  } catch (error) {
    console.error('Erro ao gerar relatório administrativo:', error);
    return res.status(500).json({ error: 'Não foi possível gerar o relatório.' });
  }
});

// ==========================================
// ROTAS: STAFF & SERVICES
// ==========================================
app.get('/api/staff/list-by-company', async (req, res) => {
  try {
    const { companyId } = req.query;
    const staffList = await Staff.find({ companyId, isActive: true }).populate('specialties');
    return res.status(200).json({ success: true, staff: staffList });
  } catch { return res.status(200).json({ staff: [] }); }
});


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


app.post('/api/services/create', authenticate, requireAdmin, requireCompanyScope, async (req, res) => {
  try {
    // 1. Desestruturamos a imageUrl enviada pelo Front-end
    const { name, description, durationInMinutes, price, imageUrl } = req.body;
    const companyId = req.auth.companyId;
    
    if (!name || !durationInMinutes) {
      return res.status(400).json({ error: 'Empresa, nome e duração são obrigatórios.' });
    }

    // --- NOVA VALIDAÇÃO PARA A IMAGEM DO SERVIÇO ---
    let validatedImageUrl = null;
    if (imageUrl !== undefined && imageUrl !== null) {
      if (typeof imageUrl !== 'string' || !imageUrl.trim()) {
        return res.status(400).json({ error: 'A URL da imagem informada é inválida.' });
      }
      validatedImageUrl = imageUrl.trim();
    }
    // -----------------------------------------------

    const newService = await Service.create({
      companyId,
      name,
      description: description || '',
      durationInMinutes: parseInt(durationInMinutes, 10),
      price: parseFloat(price) || 0,
      isActive: true,
      imageUrl: validatedImageUrl // 2. Salvamos a URL da foto recebida
    });

    return res.status(201).json({ success: true, data: newService });
  } catch (e) { 
    return res.status(500).json({ error: e.message }); 
  }
});


// ==========================================
// ROTA: CRIAR PROFISSIONAL (STAFF)
// ==========================================
app.post('/api/staff/create', authenticate, requireAdmin, requireCompanyScope, async (req, res) => {
  try {
    const { name, email, specialties } = req.body;
    const companyId = req.auth.companyId;

    if (!name) {
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
// ROTA DE LOGIN COM ISOLAMENTO POR EMPRESA
// ==========================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, companySlug } = req.body;
    const password = req.body.password || req.body.senha;

    if (!email || !password) {
      return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
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
    if (!(await verifyAndUpgradePassword(usuario, password))) {
      return res.status(401).json({ message: 'E-mail ou senha incorretos.' });
    }

    const token = createAccessToken(usuario);

    return res.status(200).json({
      success: true,
      token,
      user: {
        _id: String(usuario._id),
        name: usuario.nome, // Garante compatibilidade de chaves com o front
        email: usuario.email,
        companyId: String(usuario.companyId),
        role: usuario.role,
        companySlug: slugResolvido // 🌟 Crucial para o React saber para onde redirecionar!
      }
    });

  } catch (e) {
    if (e.message.startsWith('JWT_SECRET')) {
      return res.status(500).json({ message: 'Autenticação não configurada no servidor.' });
    }
    return res.status(500).json({ message: 'Erro interno no servidor.' });
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

    const senhaCriptografada = await hashPassword(senha);

    const novoUsuario = await User.create({
      companyId,
      nome,
      email,
      senha: senhaCriptografada, // Salva a hash estável no banco
      telefone: telefone || '',
      role: 'user'
    });

    const token = createAccessToken(novoUsuario);

    return res.status(201).json({
      success: true,
      token,
      user: { _id: novoUsuario._id, name: novoUsuario.nome, email: novoUsuario.email, role: novoUsuario.role }
    });

  } catch (e) {
    return res.status(500).json({ message: 'Erro ao criar conta: ' + e.message });
  }
});

//Rota de Busca de Agendamentos do Cliente
app.get('/api/cliente/meus-agendamentos', authenticate, requireCustomer, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.auth.userId)) {
      return res.status(401).json({ message: 'Identidade de cliente inválida.' });
    }

    const customerObjectId = new mongoose.Types.ObjectId(req.auth.userId);

    // Busca rígida trazendo os documentos
    const agendamentos = await Appointment.find({ customerId: customerObjectId })
      .populate({ path: 'companyId', select: 'name slug phone logo', options: { strictPopulate: false } })
      .populate({ path: 'serviceId', select: 'name price durationInMinutes', options: { strictPopulate: false } })
      .populate({ path: 'professionalId', select: 'name', options: { strictPopulate: false } })
      .lean();

    

    // MARGEM DE SEGURANÇA VISUAL: Considera agendamentos de hoje inteiros como "Próximos" 
    // para evitar que o fuso horário UTC da Vercel jogue o horário atual para o passado
    const inicioDoDiaAtual = new Date();
    inicioDoDiaAtual.setHours(0, 0, 0, 0);

    const proximos = agendamentos.filter(app => app.startTime && new Date(app.startTime) >= inicioDoDiaAtual)
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
      
    const passados = agendamentos.filter(app => app.startTime && new Date(app.startTime) < inicioDoDiaAtual)
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

   

    return res.status(200).json({
      success: true,
      proximos,
      passados
    });

  } catch (error) {
    console.error("❌ ERRO NO ENDPOINT DE HISTÓRICO:", error);
    return res.status(500).json({ message: 'Erro ao processar histórico.' });
  }
});




// 🌟 2. ENDPOINT PARA CANCELAMENTO DAQUELE HORÁRIO
app.delete('/api/cliente/cancelar/:id', authenticate, requireCustomer, async (req, res) => {
  try {
    const appointmentId = req.params.id;

    const agendamento = await Appointment.findOneAndDelete({
      _id: appointmentId,
      customerId: req.auth.userId
    });

    if (!agendamento) {
      return res.status(404).json({ message: 'Agendamento não encontrado ou permissão negada.' });
    }

    return res.status(200).json({ success: true, message: 'Horário cancelado com sucesso!' });
  } catch (e) {
    return res.status(500).json({ message: 'Erro ao cancelar horário: ' + e.message });
  }
});

//Rota do MercadoPago
app.post('/api/webhooks/mercado-pago',cors(), async (req, res) => {
  try {
    const notificationType = req.query.type || req.query.topic || req.body?.type || req.body?.topic;
    if (notificationType !== 'payment') {
      return res.status(200).send('Evento ignorado.');
    }

    const paymentId = req.query['data.id'] ||
      req.query.id ||
      req.body?.data?.id ||
      req.body?.id;
    const companyId = req.query.companyId || req.body?.company_id;
    if (!paymentId || !mongoose.isValidObjectId(companyId)) {
      return res.status(400).send('Identificadores do pagamento ou da empresa inválidos.');
    }

    const company = await Company.findById(companyId)
      .select('+settings.mercadoPagoAccessToken')
      .lean();
    if (!company) return res.status(404).send('Empresa não encontrada.');
    if (!company.settings?.mercadoPagoAccessToken) {
      console.error(`Empresa ${companyId} não possui credencial do Mercado Pago.`);
      return res.status(503).send('Credencial do Mercado Pago indisponível.');
    }

    const paymentClient = new MPPayment(new MercadoPagoConfig({
      accessToken: company.settings.mercadoPagoAccessToken
    }));
    const payment = await paymentClient.get({ id: String(paymentId) });
    const appointmentId = payment.external_reference;
    if (!mongoose.isValidObjectId(appointmentId)) {
      console.warn(`Pagamento Mercado Pago ${paymentId} sem referência de agendamento válida.`);
      return res.status(200).send('Pagamento sem referência reconhecida.');
    }

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      companyId
    });
    if (!appointment) {
      console.warn(`Pagamento ${paymentId} não corresponde a um agendamento da empresa ${companyId}.`);
      return res.status(200).send('Agendamento não encontrado.');
    }

    const amountMatches = Number.isFinite(Number(payment.transaction_amount)) &&
      Math.round(Number(payment.transaction_amount) * 100) === Math.round(Number(appointment.paymentAmount) * 100);
    const currencyMatches = payment.currency_id === appointment.paymentCurrency;
    const preferenceMatches = !payment.preference_id ||
      String(payment.preference_id) === appointment.gatewayPreferenceId;
    if (!amountMatches || !currencyMatches || !preferenceMatches) {
      console.error(`Pagamento ${paymentId} não confere com o valor, moeda ou preferência do agendamento ${appointment._id}.`);
      return res.status(200).send('Pagamento não corresponde ao agendamento.');
    }

    if (
      payment.status === 'approved' &&
      ['pending', 'confirmed', 'completed', 'canceled'].includes(appointment.status) &&
      appointment.paymentStatus !== 'paid'
    ) {
      if (appointment.status === 'pending') {
        const overlappingAppointment = await Appointment.exists({
          companyId,
          professionalId: appointment.professionalId,
          _id: { $ne: appointment._id },
          ...activeAppointmentFilter(),
          startTime: { $lt: appointment.endTime },
          endTime: { $gt: appointment.startTime }
        });

        if (overlappingAppointment) {
          await Appointment.updateOne(
            { _id: appointment._id, companyId, status: 'pending', paymentStatus: { $ne: 'paid' } },
            {
              $set: {
                paymentStatus: 'paid',
                paymentMethod: 'mercado_pago',
                paymentReceivedAt: new Date(payment.date_approved || Date.now()),
                paymentReceivedAmount: Number(payment.transaction_amount),
                gatewayPaymentId: String(paymentId)
              }
            }
          );
          console.error(`Pagamento ${paymentId} aprovado para horário ocupado; agendamento ${appointment._id} precisa de conciliação.`);
          return res.status(200).send('Pagamento recebido para conciliação.');
        }
      }

      await Appointment.updateOne(
        {
          _id: appointment._id,
          companyId,
          status: appointment.status,
          paymentStatus: { $ne: 'paid' }
        },
        {
          $set: {
            ...(appointment.status === 'pending' ? { status: 'confirmed' } : {}),
            paymentStatus: 'paid',
            paymentMethod: 'mercado_pago',
            paymentReceivedAt: new Date(payment.date_approved || Date.now()),
            paymentReceivedAmount: Number(payment.transaction_amount),
            gatewayPaymentId: String(paymentId)
          }
        }
      );
      console.log(`Pagamento ${paymentId} aprovado para o agendamento confirmado ${appointment._id}.`);
    }

  } catch {
    console.error("Erro crítico no processamento do webhook do Mercado Pago.");
    return res.status(500).send('Erro ao processar notificação.');
  }
  return res.status(200).send('OK');
});



// Upload de imagens autenticado para logo, banner e imagem de serviço.
import { put } from '@vercel/blob';

app.post(
  '/api/upload',
  authenticate,
  requireAdmin,
  express.raw({ type: 'image/*', limit: '4mb' }),
  async (req, res) => {
    try {
      const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
      if (!blobToken) {
        return res.status(500).json({ error: "Variável BLOB_READ_WRITE_TOKEN não configurada no servidor." });
      }

      const contentType = req.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
      const extensionsByType = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp'
      };
      const extension = extensionsByType[contentType];

      if (!extension) {
        return res.status(415).json({ error: 'Formato de imagem não suportado. Use JPEG, PNG ou WebP.' });
      }

      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        return res.status(400).json({ error: "Nenhum dado de arquivo foi recebido." });
      }

      const blob = await put(
        `${req.auth.companyId}/${crypto.randomUUID()}.${extension}`,
        req.body,
        {
          access: 'public',
          token: blobToken,
          contentType
        }
      );

      return res.status(200).json({ url: blob.url });
    } catch (error) {
      console.error("Erro no upload do servidor:", error.message);
      return res.status(500).json({ error: error.message });
    }
  }
);

app.use('/api/upload', (error, req, res, next) => {
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'A imagem deve ter no máximo 4 MB.' });
  }
  return next(error);
});

export default app;
