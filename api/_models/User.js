// src/_models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  // 🌟 OBRIGATÓRIO: Isola o usuário dentro da sua respectiva empresa
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  
  nome: { type: String, required: true },
  email: { type: String, required: true }, // ⚠️ REMOVA o unique: true daqui!
  telefone: { type: String },
  senha: { type: String },
  role: { type: String, enum: ['admin', 'user'], default: 'user' }
}, { timestamps: true });

// 🌟 SUPER IMPORTANTE: Agora o e-mail só pode ser único DENTRO da mesma empresa!
// Isso permite que o mesmo e-mail (ex: cliente@gmail.com) se cadastre na Barbaria A e no Salão B separadamente.
UserSchema.index({ companyId: 1, email: 1 }, { unique: true });

export const User = mongoose.models.User || mongoose.model('User', UserSchema, 'usuarios');
