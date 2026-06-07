const { User, Vendor, Event, Booking, Review, Category, Service } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const logger = require('../utils/logger');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users.', error: error.message });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    await user.update({ isActive: !user.isActive });
    
    logger.info({
      message: `Admin ${user.isActive ? 'activated' : 'deactivated'} user ${user.id}`,
      userId: req.user.id,
      metadata: { targetUserId: user.id, isActive: user.isActive, adminEmail: req.user.email }
    });
    
    res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}.`, user: user.toJSON() });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user.', error: error.message });
  }
};

exports.getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.findAll({
      include: [
        { model: User, as: 'user', attributes: ['name', 'email'] },
        { model: Category, as: 'category' }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json({ vendors });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch vendors.', error: error.message });
  }
};

exports.approveVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found.' });
    await vendor.update({ isApproved: !vendor.isApproved });
    
    logger.info({
      message: `Admin ${vendor.isApproved ? 'approved' : 'unapproved'} vendor ${vendor.id}`,
      userId: req.user.id,
      metadata: { targetVendorId: vendor.id, isApproved: vendor.isApproved }
    });
    
    res.json({ message: `Vendor ${vendor.isApproved ? 'approved' : 'unapproved'}.`, vendor });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update vendor.', error: error.message });
  }
};

exports.removeVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found.' });
    await vendor.destroy();
    
    logger.warn({
      message: `Admin removed vendor ${vendor.id}`,
      userId: req.user.id,
      metadata: { targetVendorId: vendor.id }
    });
    
    res.json({ message: 'Vendor removed.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove vendor.', error: error.message });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      include: [
        { model: Event, as: 'event' },
        { model: Service, as: 'service' },
        { model: Vendor, as: 'vendor' },
        { model: User, as: 'user', attributes: ['name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bookings.', error: error.message });
  }
};

exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.findAll({
      include: [{ model: User, as: 'user', attributes: ['name', 'email'] }],
      order: [['date', 'ASC']]
    });
    res.json({ events });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch events.', error: error.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.count({ where: { role: 'client' } });
    const totalVendors = await Vendor.count();
    const totalBookings = await Booking.count();
    const totalEvents = await Event.count();
    const totalRevenue = await Booking.sum('amount', { where: { status: 'completed' } }) || 0;

    
    const monthlyBookings = await Booking.findAll({
      attributes: [
        [sequelize.fn('MONTH', sequelize.col('bookingDate')), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['month'],
      order: [[sequelize.fn('MONTH', sequelize.col('bookingDate')), 'ASC']]
    });

    
    const popularCategories = await Vendor.findAll({
      attributes: [
        'categoryId',
        [sequelize.fn('COUNT', sequelize.col('Vendor.id')), 'vendorCount']
      ],
      include: [{ model: Category, as: 'category', attributes: ['name'] }],
      group: ['categoryId', 'category.id', 'category.name'],
      order: [[sequelize.fn('COUNT', sequelize.col('Vendor.id')), 'DESC']],
      limit: 5
    });

    
    const recentBookings = await Booking.findAll({
      include: [
        { model: User, as: 'user', attributes: ['name'] },
        { model: Service, as: 'service', attributes: ['name'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    res.json({
      stats: { totalUsers, totalVendors, totalBookings, totalEvents, totalRevenue },
      monthlyBookings,
      popularCategories,
      recentBookings
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch analytics.', error: error.message });
  }
};
