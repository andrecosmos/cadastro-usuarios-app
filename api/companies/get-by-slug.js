// api/companies/get-by-slug.js
import { connectToDatabase } from '../_config/database.js';
import { Company } from '../_models/Company.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  await connectToDatabase();

  try {
    const { slug } = req.query;

    if (!slug) {
      return res.status(400).json({ error: 'O parâmetro slug é obrigatório.' });
    }

    // Busca a empresa pelo slug amigável
    const company = await Company.findOne({ slug });

    if (!company) {
      return res.status(404).json({ error: 'Estabelecimento não encontrado.' });
    }

    return res.status(200).json({ success: true, company });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
