const Review = require('../models/Review');
const Product = require('../models/Product');

async function getProductRatingStats(productId) {
  const stats = await Review.aggregate([
    { $match: { product: productId, status: 'approved' } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        star5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
        star4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
        star3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
        star2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
        star1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
        withPhotos: { $sum: { $cond: [{ $gt: [{ $size: '$mediaUrls' }, 0] }, 1, 0] } }
      }
    }
  ]);

  if (!stats.length) {
    return {
      averageRating: 0,
      totalReviews: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      withPhotos: 0
    };
  }

  const s = stats[0];
  const total = s.totalReviews || 1;

  return {
    averageRating: Math.round(s.averageRating * 10) / 10,
    totalReviews: s.totalReviews,
    distribution: {
      5: Math.round((s.star5 / total) * 100),
      4: Math.round((s.star4 / total) * 100),
      3: Math.round((s.star3 / total) * 100),
      2: Math.round((s.star2 / total) * 100),
      1: Math.round((s.star1 / total) * 100)
    },
    withPhotos: s.withPhotos
  };
}

async function updateProductRating(productId) {
  const stats = await getProductRatingStats(productId);
  await Product.findByIdAndUpdate(productId, {
    rating: stats.averageRating,
    reviewCount: stats.totalReviews
  });
  return stats;
}

module.exports = {
  getProductRatingStats,
  updateProductRating
};
