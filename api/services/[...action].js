import { connectToDatabase } from '../_config/database.js';
import { Service } from '../_models/Service.js';

export default async function handler(req, res) {
  await connectToDatabase();

  const { action, ...restOfQuery } = req.query;
  
  // Garante que transformamos o array ['get-by-slug'] na string "get-by-slug"
  const currentAction = Array.isArray(action) ? action : action;

  // CÓDIGO TEMPORÁRIO DE DIAGNÓSTICO: Olhe o terminal do seu 'vercel dev' quando rodar!
  console.log('--- NOVA REQUISIÇÃO ---');
  console.log('Método:', req.method);
  console.log('Ação detectada:', currentAction);
  console.log('Parâmetros restantes da URL:', restOfQuery);


  try {
    // ----------------------------------------------------
    // ROTA: POST /api/services/create
    // ----------------------------------------------------
    if (req.method === 'POST' && currentAction === 'create') {
      const { companyId, name, description, durationInMinutes, price } = req.body;

      if (!companyId || !name || !durationInMinutes || price === undefined) {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
      }

      const newService = await Service.create({
        companyId,
        name,
        description,
        durationInMinutes,
        price,
        isActive: true
      });

      return res.status(201).json({ success: true, data: newService });
    }

    // ----------------------------------------------------
    // ROTA: GET /api/services/list-by-company
    // ----------------------------------------------------
    if (req.method === 'GET' && currentAction === 'list-by-company') {
      const { companyId } = req.query;

      if (!companyId) {
        return res.status(400).json({ error: 'O parâmetro companyId é obrigatório.' });
      }

      // Busca apenas os serviços ativos daquela empresa
      const services = await Service.find({ companyId, isActive: true });

      return res.status(200).json({ success: true, data: services });
    }

    return res.status(404).json({ error: 'Rota de serviço não encontrada.' });

  } catch (error) {
    return res.status(500).json({ error: 'Erro interno no servidor: ' + error.message });
  }
}
