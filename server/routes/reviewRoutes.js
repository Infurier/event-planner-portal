const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { validateCreateReview, validateIdParam } = require('../middleware/validators');
const { createReview, getVendorReviews } = require('../controllers/reviewController');

router.post('/', auth, roleGuard('client'), validateCreateReview, createReview);
router.get('/vendor/:vendorId', validateIdParam('vendorId', 'Vendor ID'), getVendorReviews);

module.exports = router;
