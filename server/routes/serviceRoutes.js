const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { validateIdParam, validateServiceCreate, validateServiceUpdate } = require('../middleware/validators');
const { addService, getVendorServices, getMyServices, updateService, deleteService } = require('../controllers/serviceController');

router.post('/', auth, roleGuard('vendor'), validateServiceCreate, addService);
router.get('/my-services', auth, roleGuard('vendor'), getMyServices);
router.get('/vendor/:vendorId', validateIdParam('vendorId', 'Vendor ID'), getVendorServices);
router.put('/:id', auth, roleGuard('vendor'), validateIdParam(), validateServiceUpdate, updateService);
router.delete('/:id', auth, roleGuard('vendor'), validateIdParam(), deleteService);

module.exports = router;
