const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const admin = require('../controllers/adminController');
const eventController = require('../controllers/eventController');
const logController = require('../controllers/logController');
const sessionRoutes = require('./sessionRoutes');
const { validateIdParam, validateLogExportQuery, validateLogsQuery } = require('../middleware/validators');


router.get('/users', auth, roleGuard('admin'), admin.getAllUsers);
router.put('/users/:id/status', auth, roleGuard('admin'), validateIdParam(), admin.toggleUserStatus);
router.get('/vendors', auth, roleGuard('admin'), admin.getAllVendors);
router.put('/vendors/:id/approve', auth, roleGuard('admin'), validateIdParam(), admin.approveVendor);
router.delete('/vendors/:id', auth, roleGuard('admin'), validateIdParam(), admin.removeVendor);
router.get('/bookings', auth, roleGuard('admin'), admin.getAllBookings);
router.get('/events', auth, roleGuard('admin'), admin.getAllEvents);
router.get('/analytics', auth, roleGuard('admin'), admin.getAnalytics);


router.get('/logs/export', auth, roleGuard('admin'), validateLogExportQuery, logController.exportLogs);
router.get('/logs', auth, roleGuard('admin'), validateLogsQuery, logController.getLogs);


router.use('/sessions', auth, roleGuard('admin'), sessionRoutes);

module.exports = router;
