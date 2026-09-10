import { connectToDatabase } from '../_config/database.js';
import { Appointment } from '../_models/Appointment.js';
import { Service } from '../_models/Service.js';
import { Staff } from '../_models/Staff.js';
import { Customer } from '../_models/Customer.js';
import { Company } from '../_models/Company.js';

export default async function handler(req, res) {
  await connectToDatabase();

  const { action, ...restOfQuery } = req.query;
  
  // Garante que transformamos o array ['get-by-slug'] na string "get-by-slug"
  const currentAction = Array.isArray(action) ? action : action;


  try {
    // ----------------------------------------------------
    // ROTA: POST /api/appointments/create
    // ----------------------------------------------------
    if (req.method === 'POST' && currentAction === 'create') {
      const { companyId, customerId, professionalId, serviceId, startTime } = req.body;

      if (!companyId || !customerId || !professionalId || !serviceId || !startTime) {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
      }

      // Busca o serviço para calcular o tempo de término (endTime)
      const service = await Service.findById(serviceId);
      if (!service) {
        return res.status(404).json({ error: 'Serviço não encontrado.' });
      }

      const start = new Date(startTime);
      const end = new Date(start.getTime() + service.durationInMinutes * 60000);

      const newAppointment = await Appointment.create({
        companyId,
        customerId,
        professionalId,
        serviceId,
        startTime: start,
        endTime: end,
        status: 'pending',
        paymentStatus: 'unpaid'
      });

      return res.status(201).json({ success: true, data: newAppointment });
    }

    // ----------------------------------------------------
    // ROTA: GET /api/appointments/list
    // ----------------------------------------------------
    if (req.method === 'GET' && currentAction === 'list') {
      const { companyId } = req.query;

      if (!companyId) {
        return res.status(400).json({ error: 'O parâmetro companyId é obrigatório.' });
      }

      const appointments = await Appointment.find({ companyId })
        .populate('customerId')
        .populate('serviceId')
        .populate('professionalId');

      return res.status(200).json({ success: true, data: appointments });
    }

    // ----------------------------------------------------
    // ROTA: GET /api/appointments/available-slots
    // ----------------------------------------------------
    if (req.method === 'GET' && currentAction === 'available-slots') {
      const { companyId, professionalId, date } = req.query;
      
      // Insira aqui a sua lógica original de busca de horários disponíveis
      
      return res.status(200).json({ success: true, slots: [] });
    }

    // ----------------------------------------------------
    // ROTA: PUT ou PATCH /api/appointments/update-status
    // ----------------------------------------------------
    if ((req.method === 'PUT' || req.method === 'PATCH') && currentAction === 'update-status') {
      const { appointmentId, status } = req.body;

      if (!appointmentId || !status) {
        return res.status(400).json({ error: 'appointmentId e status são obrigatórios.' });
      }

      const updated = await Appointment.findByIdAndUpdate(
        appointmentId,
        { status },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({ error: 'Agendamento não encontrado.' });
      }

      return res.status(200).json({ success: true, data: updated });
    }

    // Se não for nenhuma das rotas acima
    return res.status(404).json({ error: 'Rota de agendamento não encontrada.' });

  } catch (error) {
    return res.status(500).json({ error: 'Erro interno no servidor: ' + error.message });
  }
}
