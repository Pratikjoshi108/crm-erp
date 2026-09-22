const mongoose = require("mongoose");

const automationSchema = new mongoose.Schema(
  {
    crmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CRM",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    triggerType: {
      type: String,
      enum: [
        "stage_entered",
        "stage_exited",
        "lead_created",
        "scheduled",
      ],
      required: true,
    },

    triggerStage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stage",
      default: null,
    },

    actionType: {
      type: String,
      enum: [
        "create_reminder",
        "send_notification",
        "move_stage",
      ],
      required: true,
    },

    actionConfig: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    delayMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
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

automationSchema.index({
  crmId: 1,
  isActive: 1,
});

module.exports = mongoose.model(
  "Automation",
  automationSchema
);