const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const crypto = require('crypto');

const Session = sequelize.define('Session', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  refreshToken: {
    type: DataTypes.STRING(500),
    allowNull: false,
    unique: true
  },
  deviceInfo: {
    type: DataTypes.JSON, 
    allowNull: true
  },
  userAgent: {
    type: DataTypes.STRING(1000),
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  loginAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  logoutAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastActiveAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['isActive'] },
    { fields: ['lastActiveAt'] }
  ]
});


Session.generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

module.exports = Session;
