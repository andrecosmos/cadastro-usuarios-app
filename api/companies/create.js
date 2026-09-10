import { connectToDatabase } from '../_config/database.js';
import { Company } from '../_models/Company.js';

// Função auxiliar simples para transformar o nome da empresa em uma URL amigável (Slug)
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
  // 1. Bloqueia qualquer método que não seja POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  // 2. Conecta ao banco de dados usando nosso gerenciador de cache
  await connectToDatabase();

  try {
    const { name, email, phone } = req.body;

    // Validação básica de campos obrigatórios
    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Os campos name, email e phone são obrigatórios.' });
    }

    // 3. Gera o slug baseado no nome enviado
    const slug = generateSlug(name);

    // 4. Verifica se já existe uma empresa com o mesmo e-mail ou mesmo slug
    const companyExists = await Company.findOne({ 
      $or: [{ email }, { slug }] 
    });

    if (companyExists) {
      return res.status(400).json({ 
        error: 'Uma empresa com este e-mail ou nome similar já está cadastrada.' 
      });
    }

    // 5. Salva a nova empresa no MongoDB
    const newCompany = await Company.create({
      name,
      slug,
      email,
      phone,
      planStatus: 'trial' // Todo cliente novo começa em período de testes
    });

    // 6. Retorna a empresa criada com sucesso
    return res.status(201).json({
      success: true,
      message: 'Empresa registrada com sucesso!',
      data: newCompany
    });

  } catch (error) {
    return res.status(500).json({ error: 'Erro interno no servidor: ' + error.message });
  }
}
