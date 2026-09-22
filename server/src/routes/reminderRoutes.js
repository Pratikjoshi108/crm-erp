const express = require("express");

const {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
} = require("../controllers/reminderController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/",
  protect,
  adminOnly,
  getReminders
);

router.post(
  "/",
  protect,
  adminOnly,
  createReminder
);

router.put(
  "/:id",
  protect,
  adminOnly,
  updateReminder
);

router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteReminder
);

module.exports = router;