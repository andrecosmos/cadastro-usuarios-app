import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  professionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  
  startTime: { type: Date, required: true }, // ex: 2026-09-10T14:00:00.000Z
  endTime: { type: Date, required: true },   // Calculado na API (startTime + Service.durationInMinutes)
  
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'canceled', 'completed'], 
    default: 'pending' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['unpaid', 'paid', 'refunded'], 
    default: 'unpaid' 
  }
}, { timestamps: true });

// Cria um índice composto para agilizar buscas por horários específicos de um profissional naquela empresa
AppointmentSchema.index({ companyId: 1, professionalId: 1, startTime: 1 });

export const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);
