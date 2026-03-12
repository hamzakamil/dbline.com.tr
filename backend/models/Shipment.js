const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  provider: {
    type: String,
    enum: ['yurtici', 'aras', 'mng', 'ptt', 'manual'],
    default: 'manual'
  },
  trackingNumber: {
    type: String,
    required: true
  },
  trackingUrl: String,
  status: {
    type: String,
    enum: ['created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'returned'],
    default: 'created'
  },
  statusHistory: [{
    status: String,
    date: { type: Date, default: Date.now },
    description: String
  }],
  estimatedDelivery: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

// Takip URL'si otomatik oluştur
shipmentSchema.pre('save', function(next) {
  if (this.trackingNumber && !this.trackingUrl) {
    const urls = {
      yurtici: `https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${this.trackingNumber}`,
      aras: `https://kargotakip.araskargo.com.tr/mainpage.aspx?code=${this.trackingNumber}`,
      mng: `https://www.mngkargo.com.tr/gonderi-takip/${this.trackingNumber}`,
      ptt: `https://gonderitakip.ptt.gov.tr/Track/Verify?q=${this.trackingNumber}`,
      manual: ''
    };
    this.trackingUrl = urls[this.provider] || '';
  }
  next();
});

module.exports = mongoose.model('Shipment', shipmentSchema);
