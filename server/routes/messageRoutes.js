const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  getOrCreateConversation
} = require('../controllers/messageController');

router.get('/conversations', auth, getConversations);
router.get('/conversations/:conversationId/messages', auth, getMessages);
router.post('/send', auth, sendMessage);
router.put('/conversations/:conversationId/read', auth, markAsRead);
router.post('/conversations/find-or-create', auth, getOrCreateConversation);

module.exports = router;
