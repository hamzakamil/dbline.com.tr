const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  guestName: String,
  guestEmail: String,
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: String,
  comment: {
    type: String,
    required: true,
    maxlength: 2000
  },
  mediaUrls: [{ type: String }],
  isVerifiedBuyer: {
    type: Boolean,
    default: false
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  helpfulBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  adminReply: {
    text: String,
    repliedAt: Date
  },
  notifyOnPublish: {
    type: Boolean,
    default: false
  },
  whatsappOptIn: {
    type: Boolean,
    default: false
  },
  whatsappNumber: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

reviewSchema.index({ product: 1, status: 1 });
reviewSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
