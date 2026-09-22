const Reminder = require("../models/Reminder");
const Lead = require("../models/Lead");

const getReminders = async (req, res) => {
  try {
    const reminders =
      await Reminder.find({
        createdBy: req.user._id,
      })
        .populate(
          "leadId",
          "crmId formData currentStage"
        )
        .populate(
          "assignedTo",
          "name email"
        )
        .populate(
          "assignedTeam",
          "name"
        )
        .sort({ dueAt: 1 });

    res.json({ reminders });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const createReminder = async (req, res) => {
  try {
    const {
      leadId,
      title,
      description,
      dueAt,
      assignedTo,
      assignedTeam,
    } = req.body;

    const lead = await Lead.findOne({
      _id: leadId,
      createdBy: req.user._id,
    });

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    const reminder =
      await Reminder.create({
        crmId: lead.crmId,
        leadId,
        title,
        description,
        dueAt,
        assignedTo:
          assignedTo || lead.assignedTo || null,
        assignedTeam:
          assignedTeam ||
          lead.assignedTeam ||
          null,
        createdBy: req.user._id,
      });

    res.status(201).json({
      reminder,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const updateReminder = async (req, res) => {
  try {
    const reminder =
      await Reminder.findOne({
        _id: req.params.id,
        createdBy: req.user._id,
      });

    if (!reminder) {
      return res.status(404).json({
        message: "Reminder not found",
      });
    }

    const {
      title,
      description,
      dueAt,
      assignedTo,
      assignedTeam,
      status,
    } = req.body;

    if (title !== undefined)
      reminder.title = title;

    if (description !== undefined)
      reminder.description = description;

    if (dueAt !== undefined)
      reminder.dueAt = dueAt;

    if (assignedTo !== undefined)
      reminder.assignedTo =
        assignedTo || null;

    if (assignedTeam !== undefined)
      reminder.assignedTeam =
        assignedTeam || null;

    if (status !== undefined) {
      reminder.status = status;

      if (status === "completed") {
        reminder.completedAt =
          new Date();
      }
    }

    await reminder.save();

    res.json({
      reminder,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const deleteReminder = async (req, res) => {
  try {
    const reminder =
      await Reminder.findOne({
        _id: req.params.id,
        createdBy: req.user._id,
      });

    if (!reminder) {
      return res.status(404).json({
        message: "Reminder not found",
      });
    }

    await reminder.deleteOne();

    res.json({
      message: "Reminder deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
};