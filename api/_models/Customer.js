import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String, required: true } // Utilizado para envio de mensagens/lembretes futuros
}, { timestamps: true });

export const Customer = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
