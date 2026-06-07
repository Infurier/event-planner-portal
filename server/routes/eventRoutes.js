const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { validateChecklistUpdate, validateCreateEvent, validateIdParam, validateUpdateEvent } = require('../middleware/validators');
const { createEvent, getMyEvents, getEvent, updateEvent, deleteEvent, updateChecklist, getSuggestedChecklist } = require('../controllers/eventController');

router.post('/', auth, roleGuard('client'), validateCreateEvent, createEvent);
router.get('/', auth, roleGuard('client'), getMyEvents);
router.get('/:id', auth, validateIdParam(), getEvent);
router.get('/:id/suggested-checklist', auth, roleGuard('client'), validateIdParam(), getSuggestedChecklist);
router.put('/:id', auth, roleGuard('client'), validateIdParam(), validateUpdateEvent, updateEvent);
router.delete('/:id', auth, roleGuard('client'), validateIdParam(), deleteEvent);
router.put('/:id/checklist', auth, roleGuard('client'), validateIdParam(), validateChecklistUpdate, updateChecklist);

module.exports = router;
