const mongoose = require("mongoose");

const stageHistorySchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
      index: true,
    },

    fromStage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stage",
      default: null,
    },

    toStage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stage",
      required: true,
    },

    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    note: {
      type: String,
      default: "",
    },
    automationExecutions: {
  type: [String],
  default: [],
},
  },
  {
    timestamps: true,
  }
);

stageHistorySchema.index({
  leadId: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "StageHistory",
  stageHistorySchema
);

