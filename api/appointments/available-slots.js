import { connectToDatabase } from '../_config/database.js';
import { Appointment } from '../_models/Appointment.js';
import { Service } from '../_models/Service.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido. Use GET.' });
  }

  await connectToDatabase();

  try {
    // Exemplo de chamada: /api/appointments/available-slots?companyId=123&professionalId=456&serviceId=789&date=2026-09-15
    const { companyId, professionalId, serviceId, date } = req.query;

    if (!companyId || !professionalId || !serviceId || !date) {
      return res.status(400).json({ error: 'Os parâmetros companyId, professionalId, serviceId e date são obrigatórios.' });
    }

    const searchDate = new Date(date);
    if (isNaN(searchDate.getTime())) {
      return res.status(400).json({ error: 'Formato de data inválido. Use YYYY-MM-DD.' });
    }

    // 1. Busca a duração do serviço escolhido para saber o tamanho da janela necessária
    const service = await Service.findOne({ _id: serviceId, companyId });
    if (!service) {
      return res.status(404).json({ error: 'Serviço não encontrado.' });
    }
    const serviceDuration = service.durationInMinutes;

    // 2. Define o horário de funcionamento fixo da empresa (Exemplo: 08:00 às 18:00)
    // Em um SaaS maduro, você buscaria isso do modelo 'Company', mas vamos fixar para simplificar
    const startHour = 8;
    const endHour = 18;
    const timeSlotInterval = 30; // O calendário avança de 30 em 30 minutos

    // Monta o horário de início e fim de atendimento baseado no dia solicitado
    const businessStart = new Date(searchDate).setUTCHours(startHour, 0, 0, 0);
    const businessEnd = new Date(searchDate).setUTCHours(endHour, 0, 0, 0);

    // 3. Busca todos os agendamentos ocupados por ESSE profissional NESSE dia
    const dayStart = new Date(searchDate).setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(searchDate).setUTCHours(23, 59, 59, 999);

    const existingAppointments = await Appointment.find({
      companyId,
      professionalId,
      status: { $ne: 'canceled' },
      startTime: { $gte: new Date(dayStart), $lte: new Date(dayEnd) }
    }).sort({ startTime: 1 });

    // 4. Gera todas as possibilidades de horários do dia e filtra os livres
    const availableSlots = [];
    let currentSlot = new Date(businessStart);

    // Captura o momento exato de agora para impedir que o cliente agende horários retroativos do mesmo dia
    const now = new Date();

    while (currentSlot < new Date(businessEnd)) {
      // O horário de término projetado para o serviço se ele começasse agora
      const projectedEnd = new Date(currentSlot.getTime() + serviceDuration * 60000);

      // Regra A: Valida se o horário não ficou no passado
      const isPast = currentSlot < now;

      // Regra B: Valida se o serviço termina antes do estabelecimento fechar
      const fitsInBusinessHours = projectedEnd <= new Date(businessEnd);

      // Regra C: Verifica se há sobreposição com algum agendamento existente no banco
      const hasConflict = existingAppointments.some(appointment => {
        const appStart = new Date(appointment.startTime).getTime();
        const appEnd = new Date(appointment.endTime).getTime();
        const slotStart = currentSlot.getTime();
        const slotEnd = projectedEnd.getTime();

        // Checa se as janelas de tempo colidem
        return (slotStart < appEnd && slotEnd > appStart);
      });

      // Se o horário for no futuro, couber no dia útil e não conflitar com nada, ele está LIVRE
      if (!isPast && fitsInBusinessHours && !hasConflict) {
        // Extrai hora e minuto locais corretamente sem conversão UTC forçada
        const hours = currentSlot.getHours().toString().padStart(2, '0');
        const minutes = currentSlot.getMinutes().toString().padStart(2, '0');

        availableSlots.push({
          time: `${hours}:${minutes}`, // Exibe exato: "11:00"
          dateTimeIso: currentSlot.toISOString() // Salva o ponto universal correto no banco
        });
      }

      // Avança para o próximo bloco de tempo (ex: de 14:00 vai para 14:30)
      currentSlot = new Date(currentSlot.getTime() + timeSlotInterval * 60000);
    }

    return res.status(200).json({
      success: true,
      date,
      serviceDurationMinutes: serviceDuration,
      availableSlots
    });

  } catch (error) {
    return res.status(500).json({ error: 'Erro ao calcular grade de horários: ' + error.message });
  }
}
