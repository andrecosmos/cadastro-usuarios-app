import { connectToDatabase } from '../_config/database.js';
import { Company } from '../_models/Company.js';

// Função auxiliar mantida do seu create.js
function generateSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

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
    // ROTA: GET /api/companies/get-by-slug?slug=valor
    // ----------------------------------------------------
        // ----------------------------------------------------
        // ----------------------------------------------------
        // ----------------------------------------------------
    // ROTA: GET /api/companies/get-by-slug
    // ----------------------------------------------------
    if (req.method === 'GET' && currentAction === 'get-by-slug') {
      
      // SOLUÇÃO REAL: Extrai os parâmetros direto da URL bruta da requisição
      const urlSearchParams = new URLSearchParams(req.url.split('?')[1]);
      const slug = urlSearchParams.get('slug');

      if (!slug) {
        return res.status(400).json({ error: 'O parâmetro slug é obrigatório.' });
      }

      // Executa a busca no MongoDB com o texto puro extraído
      const company = await Company.findOne({ slug });

      if (!company) {
        return res.status(404).json({ error: 'Estabelecimento não encontrado.' });
      }

      return res.status(200).json({ success: true, company });
    }



    // Se bater em qualquer outro método ou rota inexistente dentro de /companies
    return res.status(404).json({ error: 'Rota não encontrada.' });

  } catch (error) {
    return res.status(500).json({ error: 'Erro interno no servidor: ' + error.message });
  }
}
