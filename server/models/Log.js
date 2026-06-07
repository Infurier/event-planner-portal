const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Log = sequelize.define('Log', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  level: {
    type: DataTypes.ENUM('info', 'warn', 'error', 'critical'),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  stack: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  route: {
    type: DataTypes.STRING,
    allowNull: true
  },
  method: {
    type: DataTypes.STRING,
    allowNull: true
  },
  statusCode: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  responseTime: {
    type: DataTypes.INTEGER, 
    allowNull: true
  },
  requestId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  },
  environment: {
    type: DataTypes.STRING,
    defaultValue: process.env.NODE_ENV || 'development'
  }
}, {
  timestamps: true,
  updatedAt: false 
});

module.exports = Log;
