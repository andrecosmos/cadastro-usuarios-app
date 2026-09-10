import mongoose from 'mongoose';

const ServiceSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name: { type: String, required: true }, // ex: "Alinhamento", "Corte de Cabelo"
  description: { type: String },
  durationInMinutes: { type: Number, required: true }, // ex: 30, 45, 60
  price: { type: Number, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const Service = mongoose.models.Service || mongoose.model('Service', ServiceSchema);
