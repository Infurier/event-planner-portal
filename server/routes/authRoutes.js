const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  validateChangePassword,
  validateIdParam,
  validateLogin,
  validateLogout,
  validateRefreshToken,
  validateRegister,
  validateUpdateProfile
} = require('../middleware/validators');
const {
  register, login, getMe, updateProfile, changePassword,
  refreshToken, logout, logoutAll, getActiveSessions, terminateSession
} = require('../controllers/authController');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/refresh', validateRefreshToken, refreshToken);
router.post('/logout', validateLogout, logout);
router.post('/logout-all', auth, logoutAll);
router.get('/me', auth, getMe);
router.put('/update-profile', auth, validateUpdateProfile, updateProfile);
router.put('/change-password', auth, validateChangePassword, changePassword);
router.get('/sessions', auth, getActiveSessions);
router.delete('/sessions/:sessionId', auth, validateIdParam('sessionId', 'Session ID'), terminateSession);


module.exports = router;
