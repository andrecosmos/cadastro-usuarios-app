import mongoose from 'mongoose';

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

const Usuario = mongoose.models.Usuario || mongoose.model('Usuario', usuarioSchema);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    await connectToDatabase();
    const usuarioCriado = await Usuario.create(req.body);
    return res.status(201).json(usuarioCriado);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
