import { connectToDatabase } from '../_config/database.js';
import { Company } from '../_models/Company.js';
import { Service } from '../_models/Service.js';

export default async function handler(req, res) {
  // 1. Bloqueia qualquer método que não seja POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  // 2. Conecta ao banco de dados de forma segura
  await connectToDatabase();

  try {
    const { companyId, name, description, durationInMinutes, price } = req.body;

    // Validação básica de campos obrigatórios
    if (!companyId || !name || !durationInMinutes || price === undefined) {
      return res.status(400).json({ 
        error: 'Os campos companyId, name, durationInMinutes e price são obrigatórios.' 
      });
    }

    // 3. Garante que a duração seja um número válido e maior que zero
    if (typeof durationInMinutes !== 'number' || durationInMinutes <= 0) {
      return res.status(400).json({ error: 'A duração deve ser um número de minutos maior que zero.' });
    }

    // 4. Valida se a empresa informada realmente existe no banco de dados
    const companyExists = await Company.findById(companyId);
    if (!companyExists) {
      return res.status(404).json({ error: 'Empresa não encontrada. Não é possível associar o serviço.' });
    }

    // 5. Cria o serviço amarrado àquela empresa específica
    const newService = await Service.create({
      companyId,
      name,
      description,
      durationInMinutes,
      price
    });

    // 6. Retorna o sucesso da operação
    return res.status(201).json({
      success: true,
      message: 'Serviço cadastrado com sucesso!',
      data: newService
    });

  } catch (error) {
    return res.status(500).json({ error: 'Erro interno no servidor: ' + error.message });
  }
}
