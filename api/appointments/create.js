import { connectToDatabase } from '../_config/database.js';
import { Appointment } from '../_models/Appointment.js';
import { Service } from '../_models/Service.js';
import { Staff } from '../_models/Staff.js';
import { Customer } from '../_models/Customer.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  await connectToDatabase();

  try {
    const { companyId, customerId, professionalId, serviceId, startTime } = req.body;

    // 1. Validação básica de presença de campos
    if (!companyId || !customerId || !professionalId || !serviceId || !startTime) {
      return res.status(400).json({ error: 'Todos os campos (companyId, customerId, professionalId, serviceId, startTime) são obrigatórios.' });
    }

    // 2. Transforma o startTime recebido em um objeto Date válido
    const start = new Date(startTime);
    if (isNaN(start.getTime())) {
      return res.status(400).json({ error: 'Formato de data startTime inválido. Use o padrão ISO 8601.' });
    }

    // Impedir agendamentos no passado
    if (start < new Date()) {
      return res.status(400).json({ error: 'Não é possível realizar agendamentos em datas ou horários passados.' });
    }

    // 3. Valida a existência das entidades em paralelo para ganhar performance
    const [service, staff, customer] = await Promise.all([
      Service.findOne({ _id: serviceId, companyId }),
      Staff.findOne({ _id: professionalId, companyId }),
      Customer.findOne({ _id: customerId, companyId })
    ]);

    if (!service) return res.status(404).json({ error: 'Serviço não encontrado para esta empresa.' });
    if (!staff) return res.status(404).json({ error: 'Profissional não encontrado para esta empresa.' });
    if (!customer) return res.status(404).json({ error: 'Cliente não encontrado para esta empresa.' });

    // 4. Calcula automaticamente o endTime baseado na duração do serviço cadastrado
    const end = new Date(start.getTime() + service.durationInMinutes * 60000);

    // 5. REGRA DE OURO: Validação de conflitos e sobreposição de horários
    // Procura por QUALQUER agendamento do mesmo profissional que colida com o novo intervalo
    const technicalConflict = await Appointment.findOne({
      companyId,
      professionalId,
      status: { $ne: 'canceled' }, // Ignora agendamentos que já foram cancelados
      $or: [
        // Cenário 1: Novo agendamento começa no meio de um agendamento existente
        { startTime: { $lte: start }, endTime: { $gt: start } },
        // Cenário 2: Novo agendamento termina no meio de um agendamento existente
        { startTime: { $lt: end }, endTime: { $gte: end } },
        // Cenário 3: Novo agendamento "abraça" por completo um agendamento existente
        { startTime: { $gte: start }, endTime: { $lte: end } }
      ]
    });

    if (technicalConflict) {
      return res.status(409).json({ 
        error: 'O profissional escolhido já possui um agendamento conflitante neste horário.',
        suggestedConflictTime: {
          start: technicalConflict.startTime,
          end: technicalConflict.endTime
        }
      });
    }

    // 6. Se passou por todas as regras, cria o agendamento de fato
    const newAppointment = await Appointment.create({
      companyId,
      customerId,
      professionalId,
      serviceId,
      startTime: start,
      endTime: end,
      status: 'confirmed', // Já nasce confirmado (ou 'pending' se você exigir pagamento prévio)
      paymentStatus: 'unpaid'
    });

    return res.status(201).json({
      success: true,
      message: 'Horário agendado e reservado com sucesso!',
      data: newAppointment
    });

  } catch (error) {
    return res.status(500).json({ error: 'Erro interno no motor de agendamentos: ' + error.message });
  }
}
