const express = require("express");

const {
  createForm,
  getForm,
  addField,
  updateField,
  deleteField,
} = require("../controllers/formController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Create form for a stage
router.post(
  "/stage/:stageId",
  protect,
  adminOnly,
  createForm
);

// Get stage form + fields
router.get(
  "/stage/:stageId",
  protect,
  getForm
);

// Add field
router.post(
  "/:formId/fields",
  protect,
  adminOnly,
  addField
);

// Update field
router.put(
  "/fields/:fieldId",
  protect,
  adminOnly,
  updateField
);

// Delete field
router.delete(
  "/fields/:fieldId",
  protect,
  adminOnly,
  deleteField
);

module.exports = router;