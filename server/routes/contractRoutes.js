const router = require('express').Router();
const auth = require('../middleware/auth');
const { validateIdParam } = require('../middleware/validators');
const { getContract, downloadContract, viewContractPDF } = require('../controllers/contractController');

router.get('/:bookingId', auth, validateIdParam('bookingId', 'Booking ID'), getContract);
router.get('/:bookingId/download', auth, validateIdParam('bookingId', 'Booking ID'), downloadContract);
router.get('/:bookingId/view', auth, validateIdParam('bookingId', 'Booking ID'), viewContractPDF);

module.exports = router;
