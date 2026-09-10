import mongoose from 'mongoose';

const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true }, // ex: "oficina-do-joao" ou "salao-beauty"
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  planStatus: { 
    type: String, 
    enum: ['active', 'past_due', 'trial'], 
    default: 'trial' 
  }
}, { timestamps: true });

export const Company = mongoose.models.Company || mongoose.model('Company', CompanySchema);
