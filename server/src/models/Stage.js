const mongoose = require("mongoose");

const stageSchema = new mongoose.Schema(
  {
    crmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CRM",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    order: {
      type: Number,
      required: true,
      default: 0,
    },

    color: {
      type: String,
      default: "#014C86",
    },

    isInitial: {
      type: Boolean,
      default: false,
    },

    isFinal: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

stageSchema.index({ crmId: 1, order: 1 });

module.exports = mongoose.model("Stage", stageSchema);