const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const {
  validateBookingStatusUpdate,
  validateCreateBooking,
  validateIdParam,
  validatePaymentStatusUpdate
} = require('../middleware/validators');
const { createBooking, getClientBookings, getVendorBookings, updateBookingStatus, updatePaymentStatus, cancelBooking, getBookingDetail } = require('../controllers/bookingController');

router.post('/', auth, roleGuard('client'), validateCreateBooking, createBooking);
router.get('/client', auth, roleGuard('client'), getClientBookings);
router.get('/vendor', auth, roleGuard('vendor'), getVendorBookings);
router.get('/:id', auth, validateIdParam(), getBookingDetail);
router.put('/:id/status', auth, validateIdParam(), validateBookingStatusUpdate, updateBookingStatus);
router.put('/:id/payment', auth, validateIdParam(), validatePaymentStatusUpdate, updatePaymentStatus);
router.delete('/:id', auth, roleGuard('client'), validateIdParam(), cancelBooking);

module.exports = router;
