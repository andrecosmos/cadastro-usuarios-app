// api/_config/database.js
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Por favor, defina a variável de ambiente MONGODB_URI dentro da Vercel.');
}

/**
 * Global é usado aqui para manter a conexão em cache entre as chamadas de API do Vercel.
 * Isso evita que novas conexões fiquem sendo abertas a cada requisição (Serverless).
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  // Se já temos uma conexão ativa, reutiliza ela imediatamente
  if (cached.conn) {
    return cached.conn;
  }

  // Se não há uma conexão, mas ela já está sendo criada por outra rota, aguarda a mesma promessa
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
