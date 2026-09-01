import mongoose from 'mongoose';

// String de conexão segura vinda das variáveis de ambiente da Vercel
const MONGODB_URI = process.env.MONGODB_URI;

let isConnected = false;

async function connectToDatabase() {
  if (isConnected) return;
  await mongoose.connect(MONGODB_URI);
  isConnected = true;
}

const usuarioSchema = new mongoose.Schema({
  nome: String,
  email: String,
  idade: Number,
}, { timestamps: true });

// Previne re-criar o modelo se ele já existir na memória da Vercel
const Usuario = mongoose.models.Usuario || mongoose.model('Usuario', usuarioSchema);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    await connectToDatabase();
    const usuarios = await Usuario.find();
    return res.status(200).json(usuarios);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
