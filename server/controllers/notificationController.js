const { Notification, Booking } = require('../models');
const logger = require('../utils/logger');

exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    const unreadCount = await Notification.count({ where: { userId: req.user.id, isRead: false } });
    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notifications.' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!notification) return res.status(404).json({ message: 'Notification not found.' });
    await notification.update({ isRead: true });
    res.json({ message: 'Notification marked as read.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update notification.' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.update({ isRead: true }, { where: { userId: req.user.id, isRead: false } });
    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update notifications.' });
  }
};

exports.handleBudgetAction = async (req, res) => {
  try {
    const { action } = req.body;
    if (!['accepted', 'rejected'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Must be "accepted" or "rejected".' });
    }

    const notification = await Notification.findOne({
      where: { id: req.params.id, userId: req.user.id, type: 'budget' }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Budget notification not found.' });
    }

    if (notification.actionStatus !== 'pending') {
      return res.status(400).json({ message: `This budget alert has already been ${notification.actionStatus}.` });
    }

    await notification.update({
      actionStatus: action,
      actionAt: new Date(),
      isRead: true
    });

    if (action === 'rejected' && notification.bookingId) {
      const booking = await Booking.findByPk(notification.bookingId);
      if (booking && booking.status !== 'cancelled') {
        await booking.update({ status: 'cancelled' });

        await Notification.create({
          userId: req.user.id,
          title: 'Booking Cancelled',
          message: `Booking #${booking.id} has been cancelled as you rejected the over-budget spending.`,
          type: 'booking'
        });

        logger.info({
          message: `Over-budget booking ${booking.id} cancelled by client`,
          userId: req.user.id,
          metadata: { bookingId: booking.id, notificationId: notification.id, action }
        });
      }
    }

    if (action === 'accepted') {
      logger.info({
        message: `Over-budget spending approved by client`,
        userId: req.user.id,
        metadata: { bookingId: notification.bookingId, notificationId: notification.id, action }
      });
    }

    res.json({
      message: action === 'accepted'
        ? 'Over-budget spending approved. Booking will proceed.'
        : 'Over-budget booking has been cancelled.',
      notification
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to process budget action.', error: error.message });
  }
};
