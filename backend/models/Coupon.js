const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  discountValue: { type: Number, required: true },
  minOrderAmount: { type: Number, default: 0 },
  maxUses: { type: Number, default: 1 },
  usedCount: { type: Number, default: 0 },
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  assignedTo: {
    name: String,
    phone: String,
    email: String
  },
  source: { type: String, enum: ['whatsapp_popup', 'manual', 'campaign'], default: 'whatsapp_popup' },
  expiresAt: { type: Date, required: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });

couponSchema.methods.isValid = function () {
  return this.active && this.expiresAt > new Date() && this.usedCount < this.maxUses;
};

module.exports = mongoose.model('Coupon', couponSchema);
