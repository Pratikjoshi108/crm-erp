const express = require("express");

const {
  getTeams,
  createTeam,
  addMember,
  removeMember,
} = require("../controllers/teamController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/",
  protect,
  adminOnly,
  getTeams
);

router.post(
  "/",
  protect,
  adminOnly,
  createTeam
);

router.post(
  "/:teamId/members",
  protect,
  adminOnly,
  addMember
);

router.delete(
  "/:teamId/members/:userId",
  protect,
  adminOnly,
  removeMember
);

module.exports = router;