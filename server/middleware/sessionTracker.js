const { Session } = require('../models');
const { getIO } = require('../utils/socketManager');
const logger = require('../utils/logger');
const { Op } = require('sequelize');


const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

const sessionTracker = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return next();
    }


    const activeSession = await Session.findOne({
      where: {
        userId: req.user.id,
        isActive: true


      },
      order: [['lastActiveAt', 'DESC']]
    });

    if (activeSession) {
      const now = new Date();
      const timeSinceLastActive = now.getTime() - new Date(activeSession.lastActiveAt).getTime();


      if (timeSinceLastActive > SESSION_TIMEOUT_MS) {

        activeSession.isActive = false;
        await activeSession.save();

        logger.info(`Session expired due to inactivity for user ${req.user.id}`, { sessionId: activeSession.id });


        const io = getIO();
        if (io) {
          io.to('admin').emit('session-inactive', activeSession);
        }

      } else {

        activeSession.lastActiveAt = now;
        await activeSession.save();
      }
    }

    next();
  } catch (error) {
    logger.error('Error in session tracker middleware', {}, error);
    next();
  }
};

module.exports = sessionTracker;
