const mongoose = require('mongoose');

const searchLogSchema = new mongoose.Schema({
  term: { type: String, required: true },
  normalizedTerm: String,
  resultCount: { type: Number, default: 0 },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

searchLogSchema.index({ normalizedTerm: 1 });
searchLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SearchLog', searchLogSchema);
