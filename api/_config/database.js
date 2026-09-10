import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Por favor, defina a variável de ambiente MONGODB_URI dentro da Vercel.');
}

// Mantém o cache da conexão na memória global do container serverless
let cached = global.mongoose || { conn: null };

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  // Configurações cruciais para evitar travamentos (Timeout) no plano gratuito
  const opts = {
    bufferCommands: false,
    maxPoolSize: 10,         // Limita o número de conexões simultâneas
    serverSelectionTimeoutMS: 5000, // Desiste após 5 segundos se o banco sumir
  };

  cached.conn = await mongoose.connect(MONGODB_URI, opts);
  global.mongoose = cached;

  return cached.conn;
}
