import { connectToDatabase } from '../_config/database.js';
import { Company } from '../_models/Company.js';
import { Customer } from '../_models/Customer.js';

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
    // ROTA: POST /api/customers/create
    // ----------------------------------------------------
    if (req.method === 'POST' && currentAction === 'create') {
      const { companyId, name, email, phone } = req.body;

      if (!companyId || !name || !phone) {
        return res.status(400).json({ error: 'Os campos companyId, name e phone são obrigatórios.' });
      }

      const companyExists = await Company.findById(companyId);
      if (!companyExists) {
        return res.status(404).json({ error: 'Empresa não encontrada.' });
      }

      const newCustomer = await Customer.create({
        companyId, name, email, phone
      });

      return res.status(201).json({
        success: true,
        message: 'Cliente registrado com sucesso!',
        data: newCustomer
      });
    }

    return res.status(404).json({ error: 'Rota não encontrada.' });

  } catch (error) {
    return res.status(500).json({ error: 'Erro interno no servidor: ' + error.message });
  }
}
