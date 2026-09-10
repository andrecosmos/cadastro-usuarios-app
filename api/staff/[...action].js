import { connectToDatabase } from '../_config/database.js';
import { Staff } from '../_models/Staff.js';

export default async function handler(req, res) {
  await connectToDatabase();

  const { action } = req.query;
  // Captura a ação vinda da URL (ex: 'create-user' ou 'get-users')
  const currentAction = action && action.length > 0 ? action[0] : null;

  try {
    // ----------------------------------------------------
    // ROTA: POST /api/staff/create-user
    // ----------------------------------------------------
    if (req.method === 'POST' && currentAction === 'create-user') {
      const { companyId, name, email, specialties } = req.body;

      if (!companyId || !name) {
        return res.status(400).json({ error: 'Os campos companyId e name são obrigatórios.' });
      }

      // Cria o novo integrante da equipe
      const newStaff = await Staff.create({
        companyId,
        name,
        email: email || null,
        specialties: specialties || [],
        isActive: true
      });

      return res.status(201).json({
        success: true,
        message: 'Profissional registrado com sucesso!',
        data: newStaff
      });
    }

    // ----------------------------------------------------
    // ROTA: GET /api/staff/get-users
    // ----------------------------------------------------
    if (req.method === 'GET' && currentAction === 'get-users') {
      const { companyId } = req.query;

      if (!companyId) {
        return res.status(400).json({ error: 'O parâmetro companyId é obrigatório.' });
      }

      // Busca os funcionários ativos da empresa e popula as especialidades (serviços)
      const staffList = await Staff.find({ companyId, isActive: true })
        .populate('specialties');

      return res.status(200).json({
        success: true,
        data: staffList
      });
    }

    // Se bater em qualquer outro método ou rota inexistente dentro de /staff
    return res.status(404).json({ error: 'Rota de equipe não encontrada.' });

  } catch (error) {
    return res.status(500).json({ error: 'Erro interno no servidor: ' + error.message });
  }
}
