const mongoose = require("mongoose");

const formFieldSchema = new mongoose.Schema(
  {
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form",
      required: true,
      index: true,
    },

    label: {
      type: String,
      required: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: [
        "text",
        "number",
        "email",
        "phone",
        "datetime",
        "dropdown",
        "multiselect",
        "checkbox",
        "radio",
        "file",
        "image",
        "location",
        "user",
      ],
      required: true,
    },

    required: {
      type: Boolean,
      default: false,
    },

    order: {
      type: Number,
      required: true,
      default: 0,
    },

    placeholder: {
      type: String,
      default: "",
    },

    defaultValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    options: {
      type: [String],
      default: [],
    },

    validation: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

formFieldSchema.index({
  formId: 1,
  order: 1,
});

formFieldSchema.index(
  { formId: 1, name: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "FormField",
  formFieldSchema
);