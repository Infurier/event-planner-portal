const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LoginActivity = sequelize.define('LoginActivity', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true 
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('success', 'failed'),
    allowNull: false
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  deviceInfo: {
    type: DataTypes.JSON, 
    allowNull: true
  },
  userAgent: {
    type: DataTypes.STRING(1000),
    allowNull: true
  },
  reason: {
    type: DataTypes.STRING, 
    allowNull: true
  }
}, {
  timestamps: true,
  updatedAt: false, 
  indexes: [
    { fields: ['email'] },
    { fields: ['status'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = LoginActivity;
