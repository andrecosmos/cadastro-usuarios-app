import { connectToDatabase } from '../_config/database.js';
import { Appointment } from '../_models/Appointment.js';

export default async function handler(req, res) {
  // 1. Bloqueia qualquer método que não seja PATCH ou PUT (ideal para atualizações parciais)
  if (req.method !== 'PATCH' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Método não permitido. Use PATCH ou PUT.' });
  }

  await connectToDatabase();

  try {
    const { appointmentId, companyId, status } = req.body;

    // 2. Validação básica de campos obrigatórios
    if (!appointmentId || !companyId || !status) {
      return res.status(400).json({ 
        error: 'Os campos appointmentId, companyId e status são obrigatórios.' 
      });
    }

    // 3. Valida se o status enviado é um dos permitidos pelo Schema do Mongoose
    const validStatuses = ['pending', 'confirmed', 'canceled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Status inválido. Escolha entre: ${validStatuses.join(', ')}` 
      });
    }

    // 4. Executa a atualização garantindo o isolamento (só altera se pertencer à empresa correta)
    const updatedAppointment = await Appointment.findOneAndUpdate(
      { _id: appointmentId, companyId: companyId }, // Critério de busca seguro
      { status: status },                           // Campo a ser atualizado
      { new: true }                                 // Retorna o documento já atualizado
    );

    // 5. Se não encontrou o agendamento com essas travas de segurança
    if (!updatedAppointment) {
      return res.status(404).json({ 
        error: 'Agendamento não encontrado ou não pertence a esta empresa.' 
      });
    }

    // 6. Retorna o sucesso da atualização
    return res.status(200).json({
      success: true,
      message: `Status do agendamento atualizado para '${status}' com sucesso!`,
      data: updatedAppointment
    });

  } catch (error) {
    return res.status(500).json({ error: 'Erro interno ao atualizar status: ' + error.message });
  }
}
