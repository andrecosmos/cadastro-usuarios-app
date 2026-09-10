import { connectToDatabase } from '../_config/database.js';
import { Company } from '../_models/Company.js';
import { Customer } from '../_models/Customer.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  await connectToDatabase();

  try {
    const { companyId, name, email, phone } = req.body;

    if (!companyId || !name || !phone) {
      return res.status(400).json({ error: 'Os campos companyId, name e phone são obrigatórios.' });
    }

    const companyExists = await Company.findById(companyId);
    if (!companyExists) {
      return res.status(404).json({ error: 'Empresa não encontrada.' });
    }

    // Cria o registro do cliente
    const newCustomer = await Customer.create({
      companyId,
      name,
      email,
      phone
    });

    return res.status(201).json({
      success: true,
      message: 'Cliente cadastrado com sucesso!',
      data: newCustomer
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno: ' + error.message });
  }
}
