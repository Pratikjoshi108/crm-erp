const express = require("express");

const {
  getUsers,
  updateUser,
} = require("../controllers/userController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/",
  protect,
  adminOnly,
  getUsers
);

router.put(
  "/:id",
  protect,
  adminOnly,
  updateUser
);

module.exports = router;