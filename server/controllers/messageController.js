const { Op } = require('sequelize');
const { Conversation, Message, User, Vendor } = require('../models');
const socketManager = require('../utils/socketManager');

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    const whereClause = role === 'vendor'
      ? { vendorId: userId }
      : { clientId: userId };

    const conversations = await Conversation.findAll({
      where: whereClause,
      order: [['lastMessageAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'client',
          attributes: ['id', 'name', 'avatar', 'email']
        },
        {
          model: User,
          as: 'vendor',
          attributes: ['id', 'name', 'avatar', 'email']
        },
        {
          model: Message,
          as: 'messages',
          limit: 1,
          order: [['createdAt', 'DESC']],
          attributes: ['content', 'createdAt', 'senderId', 'isRead']
        }
      ]
    });

    const enriched = await Promise.all(conversations.map(async (conv) => {
      const plain = conv.toJSON();
      const unreadCount = await Message.count({
        where: {
          conversationId: conv.id,
          senderId: { [Op.ne]: userId },
          isRead: false
        }
      });

      const otherUser = role === 'vendor' ? plain.client : plain.vendor;

      let vendorProfile = null;
      if (role === 'client') {
        vendorProfile = await Vendor.findOne({
          where: { userId: plain.vendorId },
          attributes: ['businessName']
        });
      }

      return {
        id: plain.id,
        otherUser: {
          ...otherUser,
          businessName: vendorProfile?.businessName || null
        },
        lastMessage: plain.messages?.[0] || null,
        unreadCount,
        lastMessageAt: plain.lastMessageAt,
        createdAt: plain.createdAt
      };
    }));

    res.json({ conversations: enriched });
  } catch (error) {
    console.error('getConversations error:', error);
    res.status(500).json({ message: 'Failed to fetch conversations.' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      where: {
        id: conversationId,
        [Op.or]: [{ clientId: userId }, { vendorId: userId }]
      }
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found or access denied.' });
    }

    const messages = await Message.findAll({
      where: { conversationId },
      order: [['createdAt', 'ASC']],
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'avatar']
        }
      ]
    });

    res.json({ messages, conversation });
  } catch (error) {
    console.error('getMessages error:', error);
    res.status(500).json({ message: 'Failed to fetch messages.' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { recipientId, content, conversationId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required.' });
    }

    let conversation;

    if (conversationId) {
      conversation = await Conversation.findOne({
        where: {
          id: conversationId,
          [Op.or]: [{ clientId: userId }, { vendorId: userId }]
        }
      });
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found.' });
      }
    } else if (recipientId) {
      const recipient = await User.findByPk(recipientId);
      if (!recipient) {
        return res.status(404).json({ message: 'Recipient not found.' });
      }

      let clientId, vendorId;
      if (req.user.role === 'client') {
        clientId = userId;
        vendorId = recipientId;
      } else if (req.user.role === 'vendor') {
        clientId = recipientId;
        vendorId = userId;
      } else {
        return res.status(400).json({ message: 'Only clients and vendors can send messages.' });
      }

      [conversation] = await Conversation.findOrCreate({
        where: { clientId, vendorId },
        defaults: { clientId, vendorId, lastMessageAt: new Date() }
      });
    } else {
      return res.status(400).json({ message: 'recipientId or conversationId is required.' });
    }

    const message = await Message.create({
      conversationId: conversation.id,
      senderId: userId,
      content: content.trim()
    });

    await conversation.update({ lastMessageAt: new Date() });

    const fullMessage = await Message.findByPk(message.id, {
      include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'avatar'] }]
    });

    const io = socketManager.getIO();
    if (io) {
      const recipientUserId = conversation.clientId === userId
        ? conversation.vendorId
        : conversation.clientId;

      io.to(`user_${recipientUserId}`).emit('receive_message', {
        message: fullMessage.toJSON(),
        conversationId: conversation.id
      });
    }

    res.status(201).json({ message: fullMessage, conversationId: conversation.id });
  } catch (error) {
    console.error('sendMessage error:', error);
    res.status(500).json({ message: 'Failed to send message.' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      where: {
        id: conversationId,
        [Op.or]: [{ clientId: userId }, { vendorId: userId }]
      }
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    await Message.update(
      { isRead: true },
      {
        where: {
          conversationId,
          senderId: { [Op.ne]: userId },
          isRead: false
        }
      }
    );

    res.json({ message: 'Messages marked as read.' });
  } catch (error) {
    console.error('markAsRead error:', error);
    res.status(500).json({ message: 'Failed to mark messages as read.' });
  }
};

exports.getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { vendorUserId } = req.body;

    if (!vendorUserId) {
      return res.status(400).json({ message: 'vendorUserId is required.' });
    }

    const recipient = await User.findByPk(vendorUserId);
    if (!recipient) {
      return res.status(404).json({ message: 'Vendor user not found.' });
    }

    let clientId, vendorId;
    if (req.user.role === 'client') {
      clientId = userId;
      vendorId = vendorUserId;
    } else if (req.user.role === 'vendor') {
      clientId = vendorUserId;
      vendorId = userId;
    } else {
      return res.status(400).json({ message: 'Only clients and vendors can start conversations.' });
    }

    const [conversation] = await Conversation.findOrCreate({
      where: { clientId, vendorId },
      defaults: { clientId, vendorId, lastMessageAt: new Date() }
    });

    res.json({ conversationId: conversation.id });
  } catch (error) {
    console.error('getOrCreateConversation error:', error);
    res.status(500).json({ message: 'Failed to get or create conversation.' });
  }
};
