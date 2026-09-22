const Notification = require("../models/Notification");

const getNotifications = async (req, res) => {
  try {
    const notifications =
      await Notification.find({
        userId: req.user._id,
      })
        .populate(
          "leadId",
          "crmId currentStage formData"
        )
        .sort({ createdAt: -1 })
        .limit(50);

    const unreadCount =
      await Notification.countDocuments({
        userId: req.user._id,
        isRead: false,
      });

    res.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    const notification =
      await Notification.findOne({
        _id: req.params.id,
        userId: req.user._id,
      });

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();

    await notification.save();

    res.json({
      notification,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        userId: req.user._id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    res.json({
      message:
        "All notifications marked as read",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};