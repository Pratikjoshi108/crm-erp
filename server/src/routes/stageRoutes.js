const express = require("express");

const {
  createStage,
  getStages,
  updateStage,
  deleteStage,
} = require("../controllers/stageController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/crm/:crmId",
  protect,
  adminOnly,
  createStage
);

router.get(
  "/crm/:crmId",
  protect,
  getStages
);

router.put(
  "/:stageId",
  protect,
  adminOnly,
  updateStage
);

router.delete(
  "/:stageId",
  protect,
  adminOnly,
  deleteStage
);

module.exports = router;