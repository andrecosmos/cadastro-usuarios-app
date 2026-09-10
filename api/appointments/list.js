import { connectToDatabase } from '../_config/database.js';
import { Appointment } from '../_models/Appointment.js';
// É obrigatório importar os outros modelos aqui para o .populate() funcionar na Vercel
import { Customer } from '../_models/Customer.js';
import { Staff } from '../_models/Staff.js';
import { Service } from '../_models/Service.js';

export default async function handler(req, res) {
  // 1. Bloqueia qualquer método que não seja GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido. Use GET.' });
  }

  await connectToDatabase();

  try {
    // 2. Captura os parâmetros enviados na URL (Query Strings)
    // Exemplo de URL: /api/appointments/list?companyId=123&date=2026-09-15
    const { companyId, date } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: 'O parâmetro companyId é obrigatório na URL.' });
    }

    // 3. Monta o objeto de filtro básico garantindo o isolamento da empresa
    let queryFilter = { companyId: companyId };

    // 4. Se uma data específica for enviada, filtra do início ao fim daquele dia completo
    if (date) {
      const searchDate = new Date(date);
      if (isNaN(searchDate.getTime())) {
        return res.status(400).json({ error: 'Formato de data inválido. Use o padrão YYYY-MM-DD.' });
      }

      // Cria a janela de tempo: das 00:00:00 às 23:59:59 do dia escolhido
      const startOfDay = new Date(searchDate.setUTCHours(0, 0, 0, 0));
      const endOfDay = new Date(searchDate.setUTCHours(23, 59, 59, 999));

      queryFilter.startTime = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    // 5. Busca no banco de dados trazendo os detalhes das coleções relacionadas (Join)
    const appointments = await Appointment.find(queryFilter)
      .populate('customerId', 'name phone email')        // Traz apenas nome, celular e e-mail do cliente
      .populate('professionalId', 'name')                 // Traz o nome do profissional
      .populate('serviceId', 'name durationInMinutes price') // Traz detalhes do serviço
      .sort({ startTime: 1 });                            // Ordena cronologicamente (do mais cedo ao mais tarde)

    // 6. Retorna a lista para renderizar no calendário do Frontend
    return res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });

  } catch (error) {
    return res.status(500).json({ error: 'Erro interno ao listar agendamentos: ' + error.message });
  }
}
