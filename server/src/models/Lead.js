const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    crmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CRM",
      required: true,
      index: true,
    },

    currentStage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stage",
      required: true,
      index: true,
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

    formData: {
  type: mongoose.Schema.Types.Mixed,
  default: {}
},

    stageData: {
  type: mongoose.Schema.Types.Mixed,
  default: {},
},

    notes: {
      type: String,
      default: "",
    },

    attachments: {
      type: [
        {
          name: String,
          url: String,
          type: String,
        },
      ],
      default: [],
    },

    status: {
      type: String,
      enum: ["active", "won", "lost"],
      default: "active",
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

leadSchema.index({
  crmId: 1,
  currentStage: 1,
});

module.exports = mongoose.model("Lead", leadSchema);