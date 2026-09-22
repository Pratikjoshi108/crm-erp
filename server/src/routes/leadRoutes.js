const express = require("express");

const {
  createLead,
  getLeads,
  getLead,
  moveLead,
  saveStageData,
  assignLead,
} = require("../controllers/leadController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/crm/:crmId",
  protect,
  adminOnly,
  createLead
);

router.get(
  "/crm/:crmId",
  protect,
  getLeads
);

router.get(
  "/:leadId",
  protect,
  getLead
);

router.put(
    "/:leadId/move",
     protect,
    adminOnly, 
    moveLead
);

router.put(
  "/:leadId/stage-data",
  protect,
  adminOnly,
  saveStageData
);

router.put(
  "/:leadId/assignment",
  protect,
  assignLead
);

router.put(
  "/:leadId/assignment",
  protect,
  adminOnly,
  assignLead
);

module.exports = router;