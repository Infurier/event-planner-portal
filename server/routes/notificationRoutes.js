const router = require('express').Router();
const auth = require('../middleware/auth');
const { validateIdParam } = require('../middleware/validators');
const { getMyNotifications, markAsRead, markAllAsRead, handleBudgetAction } = require('../controllers/notificationController');

router.get('/', auth, getMyNotifications);
router.put('/read-all', auth, markAllAsRead);
router.put('/:id/read', auth, validateIdParam('id', 'Notification ID'), markAsRead);
router.put('/:id/budget-action', auth, validateIdParam('id', 'Notification ID'), handleBudgetAction);

module.exports = router;
