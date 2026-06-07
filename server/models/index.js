const sequelize = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const Vendor = require('./Vendor');
const Event = require('./Event');
const Service = require('./Service');
const Booking = require('./Booking');
const Review = require('./Review');
const Notification = require('./Notification');
const Contract = require('./Contract');
const Session = require('./Session');
const Log = require('./Log');
const LoginActivity = require('./LoginActivity');
const Conversation = require('./Conversation');
const Message = require('./Message');


User.hasMany(Event, { foreignKey: 'userId', as: 'events' });
User.hasOne(Vendor, { foreignKey: 'userId', as: 'vendor' });
User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' });
User.hasMany(Booking, { foreignKey: 'userId', as: 'bookings' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
User.hasMany(Session, { foreignKey: 'userId', as: 'sessions' });
User.hasMany(LoginActivity, { foreignKey: 'userId' });


Category.hasMany(Vendor, { foreignKey: 'categoryId', as: 'vendors' });


Vendor.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Vendor.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Vendor.hasMany(Service, { foreignKey: 'vendorId', as: 'services' });
Vendor.hasMany(Booking, { foreignKey: 'vendorId', as: 'bookings' });
Vendor.hasMany(Review, { foreignKey: 'vendorId', as: 'reviews' });


Event.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Event.hasMany(Booking, { foreignKey: 'eventId', as: 'bookings' });


Service.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' });
Service.hasMany(Booking, { foreignKey: 'serviceId', as: 'bookings' });


Booking.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });
Booking.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });
Booking.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' });
Booking.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Booking.hasOne(Review, { foreignKey: 'bookingId', as: 'review' });
Booking.hasOne(Contract, { foreignKey: 'bookingId', as: 'contract' });


Contract.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });


Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Review.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' });
Review.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });
Review.belongsTo(User, { as: 'client', foreignKey: 'clientId' }); 


Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });


Session.belongsTo(User, { foreignKey: 'userId', as: 'user' });


LoginActivity.belongsTo(User, { foreignKey: 'userId' });


Conversation.belongsTo(User, { as: 'client', foreignKey: 'clientId' });
Conversation.belongsTo(User, { as: 'vendor', foreignKey: 'vendorId' });
Conversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages' });

Message.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });
Message.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });

module.exports = {
  sequelize,
  User,
  Category,
  Vendor,
  Event,
  Service,
  Booking,
  Review,
  Notification,
  Contract,
  Session,
  Log,
  LoginActivity,
  Conversation,
  Message
};
