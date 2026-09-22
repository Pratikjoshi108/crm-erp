const Notification = require("../models/Notification");

let ioInstance = null;

const setIO = (io) => {
  ioInstance = io;
};

const createNotification = async ({
  userId,
  title,
  message,
  type = "system",
  leadId = null,
}) => {
  if (!userId) {
    return null;
  }

  const notification =
    await Notification.create({
      userId,
      title,
      message,
      type,
      leadId,
    });

  if (ioInstance) {
    ioInstance
      .to(`user:${userId}`)
      .emit(
        "notification",
        notification
      );
  }

  return notification;
};

module.exports = {
  setIO,
  createNotification,
};