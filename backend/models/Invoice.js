const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  companyInfo: {
    name: String,
    taxId: String,
    taxOffice: String,
    address: String,
    phone: String,
    email: String
  },
  customerInfo: {
    name: String,
    address: String,
    phone: String,
    email: String,
    taxId: String,
    taxOffice: String
  },
  items: [{
    name: String,
    quantity: Number,
    unitPrice: Number,
    taxRate: { type: Number, default: 20 },
    totalPrice: Number
  }],
  subtotal: Number,
  taxAmount: Number,
  shippingCost: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  totalAmount: Number,
  status: {
    type: String,
    enum: ['draft', 'issued', 'submitted', 'cancelled'],
    default: 'issued'
  },
  pdfUrl: String,
  issuedAt: { type: Date, default: Date.now },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // E-Fatura Bilgileri
  eInvoice: {
    enabled: { type: Boolean, default: false },
    provider: { type: String, enum: ['bimasraf', 'nes', 'edm', null], default: null },
    ettn: String,
    providerTransactionId: String,
    invoiceType: { type: String, default: 'SATIS' },
    invoiceProfile: { type: String, default: 'EARSIVFATURA' },
    eInvoiceStatus: {
      type: String,
      enum: ['local_draft', 'sent_draft', 'pending', 'in_progress', 'completed', 'error', 'cancelled'],
      default: 'local_draft'
    },
    errorMessage: String,
    providerResponse: mongoose.Schema.Types.Mixed,
    sentAt: Date,
    completedAt: Date,
    accountingPartyId: String
  }
}, {
  timestamps: true
});

// Otomatik fatura numarası oluşturma
invoiceSchema.statics.generateNumber = async function(prefix = 'INV') {
  const year = new Date().getFullYear();
  const count = await this.countDocuments({
    invoiceNumber: new RegExp(`^${prefix}-${year}-`)
  });
  const num = String(count + 1).padStart(4, '0');
  return `${prefix}-${year}-${num}`;
};

module.exports = mongoose.model('Invoice', invoiceSchema);
