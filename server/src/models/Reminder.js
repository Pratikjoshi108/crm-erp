const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema(
  {
    crmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CRM",
      required: true,
    },

    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    assignedTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserTeam",
      default: null,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    dueAt: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },

    completedAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

reminderSchema.index({
  dueAt: 1,
  status: 1,
});

reminderSchema.index({
  leadId: 1,
});

module.exports = mongoose.model(
  "Reminder",
  reminderSchema
);