import mongoose from 'mongoose';

const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true }, 
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  planStatus: { 
    type: String, 
    enum: ['active', 'past_due', 'trial'], 
    default: 'trial' 
  },
  
  // --- NOVOS CAMPOS PARA ARMAZENAR AS IMAGENS ---
  bannerUrl: { 
    type: String, 
    default: null 
  },
  logoUrl: { 
    type: String, 
    default: null 
  },
  // ----------------------------------------------
  
  settings: {
    mercadoPagoAccessToken: { type: String, default: null, select: false }
  }  

}, { timestamps: true });

export const Company = mongoose.models.Company || mongoose.model('Company', CompanySchema);

