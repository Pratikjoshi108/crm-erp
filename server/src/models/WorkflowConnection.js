const mongoose = require("mongoose");

const workflowConnectionSchema = new mongoose.Schema(
  {
    crmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CRM",
      required: true,
      index: true,
    },

    fromStage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stage",
      required: true,
    },

    toStage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stage",
      required: true,
    },

    label: {
      type: String,
      default: "",
      trim: true,
    },

    condition: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

workflowConnectionSchema.index({
  crmId: 1,
  fromStage: 1,
});

module.exports = mongoose.model(
  "WorkflowConnection",
  workflowConnectionSchema
);