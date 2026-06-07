const { Booking, Event, Service, Vendor, User, Notification } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { generateContract } = require('./contractController');
const logger = require('../utils/logger');

const checkBudgetOverlimit = async (eventId, userId, bookingId) => {
  try {
    const event = await Event.findByPk(eventId);
    if (!event || !event.budget || Number(event.budget) <= 0) return;

    const result = await Booking.findOne({
      where: { eventId, status: { [Op.notIn]: ['cancelled', 'rejected'] } },
      attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'totalSpent']],
      raw: true
    });

    const totalSpent = Number(result?.totalSpent || 0);
    const budget = Number(event.budget);

    if (totalSpent > budget) {
      const existing = await Notification.findOne({
        where: {
          userId,
          type: 'budget',
          bookingId: bookingId || null,
          actionStatus: 'pending'
        }
      });

      if (!existing) {
        await Notification.create({
          userId,
          title: 'Budget Alert — Approval Required',
          message: `Your spending on "${event.name}" (₹${totalSpent.toLocaleString()}) has exceeded your budget of ₹${budget.toLocaleString()} by ₹${(totalSpent - budget).toLocaleString()}. Please approve or reject this over-budget booking.`,
          type: 'budget',
          bookingId: bookingId || null,
          actionStatus: 'pending'
        });
      }
    }
  } catch (err) {
    console.error('Budget check error:', err.message);
  }
};

exports.createBooking = async (req, res) => {
  try {
    const { eventId, serviceId, vendorId, amount, bookingDate, notes } = req.body;

    const event = await Event.findOne({ where: { id: eventId, userId: req.user.id } });
    if (!event) return res.status(404).json({ message: 'Event not found.' });
    if (['completed', 'cancelled'].includes(event.status)) {
      return res.status(400).json({ message: 'Bookings cannot be created for completed or cancelled events.' });
    }

    const vendor = await Vendor.findByPk(vendorId);
    if (!vendor || !vendor.isApproved) {
      return res.status(400).json({ message: 'Selected vendor is unavailable.' });
    }

    const service = await Service.findOne({
      where: { id: serviceId, vendorId, isActive: true }
    });
    if (!service) {
      return res.status(400).json({ message: 'Selected service is unavailable for this vendor.' });
    }

    const servicePrice = Number(service.price);
    if (Math.abs(Number(amount) - servicePrice) > 0.01) {
      return res.status(400).json({
        message: 'Booking amount does not match the current service price.',
        errors: { amount: 'Please refresh and try booking with the latest service price.' }
      });
    }

    const conflicting = await Booking.findOne({
      where: { vendorId, bookingDate, status: 'confirmed' }
    });
    if (conflicting) {
      return res.status(409).json({ message: 'Vendor is already booked on this date. Please choose a different date or vendor.' });
    }

    const booking = await Booking.create({
      eventId, serviceId, vendorId,
      userId: req.user.id,
      amount: servicePrice, bookingDate, notes,
      status: 'pending',
      paymentStatus: 'unpaid'
    });

    if (vendor) {
      await Notification.create({
        userId: vendor.userId,
        title: 'New Booking Request',
        message: `New booking for "${event.name}" on ${bookingDate}. Amount: ₹${servicePrice.toLocaleString()}.`,
        type: 'booking'
      });
    }

    logger.info({
      message: `Booking created for event ${eventId} with vendor ${vendorId}`,
      userId: req.user.id,
      metadata: { bookingId: booking.id, amount: servicePrice, bookingDate }
    });

    await checkBudgetOverlimit(eventId, req.user.id, booking.id);

    res.status(201).json({ message: 'Booking request sent! The vendor will confirm shortly.', booking });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create booking.', error: error.message });
  }
};

exports.getBookingDetail = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: Event, as: 'event' },
        { model: Service, as: 'service' },
        { model: Vendor, as: 'vendor', include: [{ model: User, as: 'user', attributes: ['name', 'email', 'phone'] }] },
        { model: User, as: 'user', attributes: ['name', 'email', 'phone'] }
      ]
    });
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    
    const vendor = await Vendor.findOne({ where: { userId: req.user.id } });
    const isClient = booking.userId === req.user.id;
    const isVendor = vendor && booking.vendorId === vendor.id;
    if (!isClient && !isVendor && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    res.json({ booking });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch booking.', error: error.message });
  }
};

exports.getClientBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { userId: req.user.id },
      include: [
        { model: Event, as: 'event' },
        { model: Service, as: 'service' },
        { model: Vendor, as: 'vendor', include: [{ model: User, as: 'user', attributes: ['name', 'email', 'phone'] }] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bookings.', error: error.message });
  }
};

exports.getVendorBookings = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ where: { userId: req.user.id } });
    if (!vendor) return res.status(404).json({ message: 'Vendor profile not found.' });

    const bookings = await Booking.findAll({
      where: { vendorId: vendor.id },
      include: [
        { model: Event, as: 'event' },
        { model: Service, as: 'service' },
        { model: User, as: 'user', attributes: ['name', 'email', 'phone'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bookings.', error: error.message });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    const vendor = await Vendor.findOne({ where: { userId: req.user.id } });
    const isOwner = booking.userId === req.user.id;
    const isVendor = vendor && booking.vendorId === vendor.id;

    if (!isOwner && !isVendor && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    if (isOwner && req.user.role === 'client') {
      return res.status(403).json({ message: 'Clients cannot update booking status directly. Please use cancellation for pending bookings.' });
    }

    if (isVendor) {
      const allowedStatuses = booking.status === 'pending'
        ? ['confirmed', 'rejected']
        : booking.status === 'confirmed'
          ? ['completed']
          : [];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: 'Invalid booking status transition.',
          errors: { status: `Vendors can change this booking to: ${allowedStatuses.join(', ') || 'no further status'}.` }
        });
      }
    }

    if (status === 'confirmed') {
      const conflicting = await Booking.findOne({
        where: {
          vendorId: booking.vendorId,
          bookingDate: booking.bookingDate,
          status: 'confirmed',
          id: { [Op.ne]: booking.id }
        }
      });

      if (conflicting) {
        return res.status(409).json({ message: 'This vendor already has a confirmed booking on the selected date.' });
      }
    }

    await booking.update({ status });

    
    const notifyUserId = isVendor ? booking.userId : (await Vendor.findByPk(booking.vendorId))?.userId;
    if (notifyUserId) {
      const statusLabels = { confirmed: 'accepted', rejected: 'rejected', completed: 'marked as completed' };
      await Notification.create({
        userId: notifyUserId,
        title: 'Booking Status Updated',
        message: `Booking #${booking.id} has been ${statusLabels[status] || status}.`,
        type: 'booking'
      });
    }

    
    let contract = null;
    if (status === 'confirmed') {
      try {
        contract = await generateContract(booking.id);
        console.log(`📄 Contract generated: ${contract.contractNumber}`);
      } catch (err) {
        console.error('Contract generation failed:', err.message);
      }
    }

    logger.info({
      message: `Booking ${booking.id} status updated to ${status}`,
      userId: req.user.id,
      metadata: { bookingId: booking.id, newStatus: status }
    });

    if (status === 'confirmed') {
      await checkBudgetOverlimit(booking.eventId, booking.userId, booking.id);
    }

    res.json({ message: 'Booking status updated.', booking, contract });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update booking.', error: error.message });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    
    const vendor = await Vendor.findOne({ where: { userId: req.user.id } });
    const isVendor = vendor && booking.vendorId === vendor.id;
    if (!isVendor && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    if (!['confirmed', 'completed'].includes(booking.status) && paymentStatus !== 'unpaid') {
      return res.status(400).json({
        message: 'Payment status cannot be updated for bookings that are not confirmed.',
        errors: { paymentStatus: 'Only confirmed or completed bookings can be marked as partially paid or paid.' }
      });
    }

    await booking.update({ paymentStatus });

    
    await Notification.create({
      userId: booking.userId,
      title: 'Payment Status Updated',
      message: `Payment for booking #${booking.id} is now "${paymentStatus}".`,
      type: 'payment'
    });

    logger.info({
      message: `Payment status updated to ${paymentStatus} for booking ${booking.id}`,
      userId: req.user.id,
      metadata: { bookingId: booking.id, paymentStatus }
    });

    res.json({ message: 'Payment status updated.', booking });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update payment status.', error: error.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    if (booking.status === 'confirmed') {
      return res.status(400).json({ message: 'Cannot cancel a confirmed booking. Please contact the vendor.' });
    }

    await booking.update({ status: 'cancelled' });

    const vendorUser = await Vendor.findByPk(booking.vendorId);
    if (vendorUser) {
      await Notification.create({
        userId: vendorUser.userId,
        title: 'Booking Cancelled',
        message: `Booking #${booking.id} has been cancelled by the client.`,
        type: 'booking'
      });
    }

    logger.warn({
      message: `Booking ${booking.id} cancelled by client`,
      userId: req.user.id,
      metadata: { bookingId: booking.id }
    });

    res.json({ message: 'Booking cancelled.', booking });
  } catch (error) {
    res.status(500).json({ message: 'Failed to cancel booking.', error: error.message });
  }
};
