const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { validateCategoryCreate, validateCategoryUpdate, validateIdParam } = require('../middleware/validators');
const { getAll, create, update, remove } = require('../controllers/categoryController');

router.get('/', getAll);
router.post('/', auth, roleGuard('admin'), validateCategoryCreate, create);
router.put('/:id', auth, roleGuard('admin'), validateIdParam(), validateCategoryUpdate, update);
router.delete('/:id', auth, roleGuard('admin'), validateIdParam(), remove);

module.exports = router;
