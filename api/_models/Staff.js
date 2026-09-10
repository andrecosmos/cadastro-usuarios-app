import mongoose from 'mongoose';

const StaffSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name: { type: String, required: true },
  email: { type: String },
  specialties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }], // IDs dos serviços que ele faz
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const Staff = mongoose.models.Staff || mongoose.model('Staff', StaffSchema);
