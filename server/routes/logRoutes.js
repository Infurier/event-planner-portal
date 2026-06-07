const router = require('express').Router();
const logController = require('../controllers/logController');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { validateClientLog } = require('../middleware/validators');





const optionalAuth = (req, res, next) => {
  
  if (!req.header('Authorization')) return next();
  
  
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; 
  } catch (err) {
    
  }
  next();
};

router.post('/', optionalAuth, validateClientLog, logController.createClientLog);

module.exports = router;
