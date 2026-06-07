const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('booking', 'event', 'system', 'review', 'budget', 'payment'),
    defaultValue: 'system'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  bookingId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null
  },
  actionStatus: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
    allowNull: true,
    defaultValue: null
  },
  actionAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  }
}, {
  timestamps: true
});

module.exports = Notification;
