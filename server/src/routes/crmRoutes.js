const express = require("express");

const {
  createCRM,
  getCRMs,
} = require("../controllers/crmController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, adminOnly, createCRM);

router.get("/", protect, getCRMs);

module.exports = router;