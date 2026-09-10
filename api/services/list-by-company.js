import { connectToDatabase } from '../_config/database.js';
import { Service } from '../_models/Service.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido.' });
  await connectToDatabase();

  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'O parâmetro companyId é obrigatório.' });

    // Busca apenas os serviços ativos daquela empresa
    const services = await Service.find({ companyId, isActive: true });
    return res.status(200).json({ success: true, services });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
