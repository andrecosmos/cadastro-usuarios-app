import { connectToDatabase } from '../_config/database.js';
import { Company } from '../_models/Company.js';

// Função auxiliar mantida do seu create.js
function generateSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD') // Remove acentos
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífen
    .replace(/-+/g, '-'); // Remove múltiplos hifens
}

export default async function handler(req, res) {
  await connectToDatabase();

  const { action } = req.query;
  
  // CORREÇÃO CRUCIAL: Extrai a string pura se a Vercel mandar como Array
  const currentAction = Array.isArray(action) ? action[0] : action;

  try {
    // ----------------------------------------------------
    // ROTA: POST /api/companies/create
    // ----------------------------------------------------
    if (req.method === 'POST' && currentAction === 'create') {
      const { name, email, phone } = req.body;

      if (!name || !email || !phone) {
        return res.status(400).json({ error: 'Os campos name, email e phone são obrigatórios.' });
      }

      const slug = generateSlug(name);
      const companyExists = await Company.findOne({ $or: [{ email }, { slug }] });

      if (companyExists) {
        return res.status(400).json({ 
          error: 'Uma empresa com este e-mail ou nome similar já está cadastrada.' 
        });
      }

      const newCompany = await Company.create({
        name, slug, email, phone, planStatus: 'trial'
      });

      return res.status(201).json({
        success: true,
        message: 'Empresa registrada com sucesso!',
        data: newCompany
      });
    }

    // ----------------------------------------------------
    // ROTA: GET /api/companies/get-by-slug
    // ----------------------------------------------------
    if (req.method === 'GET' && currentAction === 'get-by-slug') { 
      // Extrai os parâmetros direto da URL bruta da requisição para blindar contra a Vercel
      const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
      const slug = parsedUrl.searchParams.get('slug');

      if (!slug) {
        return res.status(400).json({ error: 'O parâmetro slug é obrigatório.' });
      }

      const company = await Company.findOne({ slug });

      if (!company) {
        return res.status(404).json({ error: 'Estabelecimento não encontrado.' });
      }

      return res.status(200).json({ success: true, company });
    }

    // Se bater em qualquer outra rota inexistente dentro de /companies
    return res.status(404).json({ error: `Rota não encontrada. Ação: ${currentAction}` });

  } catch (error) {
    return res.status(500).json({ error: 'Erro interno no servidor: ' + error.message });
  }
}
