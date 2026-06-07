const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Contract = sequelize.define('Contract', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  bookingId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  contractNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  filePath: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  clientName: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  vendorName: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  businessName: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  eventName: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  eventDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  eventLocation: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  serviceCategory: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  serviceName: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  serviceDescription: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  totalCost: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  advanceAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  remainingAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  }
}, {
  timestamps: true
});

module.exports = Contract;
