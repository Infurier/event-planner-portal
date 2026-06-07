const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { validateAvailabilityQuery, validateIdParam, validateVendorProfile, validateVendorSearchQuery } = require('../middleware/validators');
const { getAllVendors, getVendor, updateVendorProfile, getMyVendorProfile, checkAvailability, getSimilarVendors, uploadPortfolioImages, deletePortfolioImage } = require('../controllers/vendorController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/portfolio')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname)}`)
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  cb(null, allowed.includes(ext));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', validateVendorSearchQuery, getAllVendors);
router.get('/my-profile', auth, roleGuard('vendor'), getMyVendorProfile);
router.get('/:id', validateIdParam(), getVendor);
router.get('/:id/availability', auth, validateIdParam(), validateAvailabilityQuery, checkAvailability);
router.get('/:id/similar', validateIdParam(), getSimilarVendors);
router.put('/profile', auth, roleGuard('vendor'), validateVendorProfile, updateVendorProfile);
router.post('/upload-portfolio', auth, roleGuard('vendor'), upload.array('images', 5), uploadPortfolioImages);
router.delete('/portfolio/:index', auth, roleGuard('vendor'), deletePortfolioImage);

module.exports = router;
