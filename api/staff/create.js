import { connectToDatabase } from '../_config/database.js';
import { Company } from '../_config/../_models/Company.js';
import { Staff } from '../_models/Staff.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  await connectToDatabase();

  try {
    const { companyId, name, email, specialties } = req.body;

    if (!companyId || !name) {
      return res.status(400).json({ error: 'Os campos companyId e name são obrigatórios.' });
    }

    // Valida se a empresa existe
    const companyExists = await Company.findById(companyId);
    if (!companyExists) {
      return res.status(404).json({ error: 'Empresa não encontrada.' });
    }

    // Cria o profissional vinculado à empresa
    const newStaff = await Staff.create({
      companyId,
      name,
      email,
      specialties: specialties || [] // IDs dos serviços salvos anteriormente
    });

    return res.status(201).json({
      success: true,
      message: 'Profissional cadastrado com sucesso!',
      data: newStaff
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno: ' + error.message });
  }
}
