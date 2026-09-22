const express = require("express");

const {
  createConnection,
  getConnections,
  deleteConnection,
} = require("../controllers/workflowController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/crm/:crmId",
  protect,
  adminOnly,
  createConnection
);

router.get(
  "/crm/:crmId",
  protect,
  getConnections
);

router.delete(
  "/:connectionId",
  protect,
  adminOnly,
  deleteConnection
);

module.exports = router;