// src/_models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  telefone: { type: String, required: true },
  senha: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  // 🌟 ADICIONADO: Guarda a qual estabelecimento o usuário pertence (Opcional para logins globais)
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' }
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model('User', UserSchema, 'usuarios');
