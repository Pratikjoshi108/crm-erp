const mongoose = require("mongoose");

const formSchema = new mongoose.Schema(
  {
    crmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CRM",
      required: true,
      index: true,
    },

    stageId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Stage",
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
      trim: true,
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

formSchema.index(
  { stageId: 1 },
  { unique: true }
);

module.exports = mongoose.model("Form", formSchema);