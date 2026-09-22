const User = require("../models/User");

const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({ users });
  } catch (error) {
    console.error("Get users error:", error);

    res.status(500).json({
      message: "Failed to fetch users",
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      role,
      isActive,
    } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (name !== undefined) {
      user.name = name.trim();
    }

    if (role !== undefined) {
      if (!["admin", "user"].includes(role)) {
        return res.status(400).json({
          message: "Invalid role",
        });
      }

      user.role = role;
    }

    if (isActive !== undefined) {
      user.isActive = Boolean(isActive);
    }

    await user.save();

    const safeUser =
      await User.findById(user._id)
        .select("-password");

    res.json({
      user: safeUser,
    });
  } catch (error) {
    console.error("Update user error:", error);

    res.status(500).json({
      message: "Failed to update user",
    });
  }
};

module.exports = {
  getUsers,
  updateUser,
};