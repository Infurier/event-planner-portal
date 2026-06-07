const { Review, Vendor, User, Booking } = require('../models');

exports.createReview = async (req, res) => {
  try {
    const { vendorId, bookingId, rating, comment } = req.body;

    const vendor = await Vendor.findByPk(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found.' });
    }

    if (bookingId) {
      const booking = await Booking.findOne({
        where: { id: bookingId, userId: req.user.id, vendorId }
      });

      if (!booking) {
        return res.status(400).json({
          message: 'This booking cannot be reviewed.',
          errors: { bookingId: 'You can only review your own completed bookings for this vendor.' }
        });
      }

      if (booking.status !== 'completed') {
        return res.status(400).json({
          message: 'Reviews can only be submitted after a booking is completed.',
          errors: { bookingId: 'Only completed bookings can be reviewed.' }
        });
      }
    }

    if (bookingId) {
      const existing = await Review.findOne({ where: { bookingId, userId: req.user.id } });
      if (existing) return res.status(400).json({ message: 'You already reviewed this booking.' });
    }

    const review = await Review.create({
      userId: req.user.id, vendorId, bookingId, rating, comment
    });

    
    const reviews = await Review.findAll({ where: { vendorId } });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Vendor.update(
      { rating: Math.round(avgRating * 10) / 10, totalReviews: reviews.length },
      { where: { id: vendorId } }
    );

    res.status(201).json({ message: 'Review submitted.', review });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit review.', error: error.message });
  }
};

exports.getVendorReviews = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { vendorId: req.params.vendorId },
      include: [{ model: User, as: 'user', attributes: ['name', 'avatar'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch reviews.', error: error.message });
  }
};
