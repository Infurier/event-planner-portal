const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('Wedding', 'Birthday', 'Corporate', 'Party', 'Conference', 'Other'),
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  guestCount: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  budget: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    defaultValue: 0
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('planning', 'confirmed', 'completed', 'cancelled'),
    defaultValue: 'planning'
  },
  checklist: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  }
}, {
  timestamps: true
});

module.exports = Event;
