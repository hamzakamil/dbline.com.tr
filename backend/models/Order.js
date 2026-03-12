const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: String,
  image: String,
  price: Number,
  size: String,
  color: String,
  quantity: {
    type: Number,
    required: true,
    min: 1
  }
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    zipCode: String,
    country: { type: String, default: 'Türkiye' }
  },
  totalAmount: {
    type: Number,
    required: true
  },
  shippingCost: {
    type: Number,
    default: 0
  },
  couponCode: { type: String, default: null },
  discountAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentId: String,
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  trackingNumber: String,
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
