const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { validateIdParam, validateInactiveSessionsQuery, validateLoginLogsQuery } = require('../middleware/validators');




router.get('/active', sessionController.getActiveSessions);
router.get('/inactive', validateInactiveSessionsQuery, sessionController.getInactiveSessions);
router.get('/login-logs', validateLoginLogsQuery, sessionController.getLoginLogs);
router.delete('/:id', validateIdParam(), sessionController.terminateSession);
router.delete('/user/:userId', validateIdParam('userId', 'User ID'), sessionController.terminateUserSessions);

module.exports = router;
