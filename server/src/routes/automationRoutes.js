const express = require("express");

const {
  getAutomations,
  createAutomation,
  updateAutomation,
  deleteAutomation,
} = require("../controllers/automationController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/",
  protect,
  adminOnly,
  getAutomations
);

router.post(
  "/",
  protect,
  adminOnly,
  createAutomation
);

router.put(
  "/:id",
  protect,
  adminOnly,
  updateAutomation
);

router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteAutomation
);

module.exports = router;