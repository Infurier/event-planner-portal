const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  serviceId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  vendorId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'rejected', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  bookingDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  paymentStatus: {
    type: DataTypes.ENUM('unpaid', 'partially_paid', 'paid'),
    defaultValue: 'unpaid'
  }
}, {
  timestamps: true
});

module.exports = Booking;
