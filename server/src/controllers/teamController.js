const UserTeam = require("../models/UserTeam");
const User = require("../models/User");

const getTeams = async (req, res) => {
  try {
    const teams = await UserTeam.find()
      .populate("members", "name email role")
      .sort({ createdAt: -1 });

    res.json({ teams });
  } catch (error) {
    console.error("Get teams error:", error);

    res.status(500).json({
      message: "Failed to fetch teams",
    });
  }
};

const createTeam = async (req, res) => {
  try {
    const {
      name,
      description,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message: "Team name is required",
      });
    }

    const team = await UserTeam.create({
      name: name.trim(),
      description:
        description?.trim() || "",
      createdBy: req.user._id,
    });

    res.status(201).json({
      team,
    });
  } catch (error) {
    console.error("Create team error:", error);

    res.status(500).json({
      message: "Failed to create team",
    });
  }
};

const addMember = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { userId } = req.body;

    const team = await UserTeam.findById(teamId);
    const user = await User.findById(userId);

    if (!team) {
      return res.status(404).json({
        message: "Team not found",
      });
    }

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!team.members.includes(user._id)) {
      team.members.push(user._id);
    }

    if (!user.teamIds.includes(team._id)) {
      user.teamIds.push(team._id);
    }

    await team.save();
    await user.save();

    await team.populate(
      "members",
      "name email role"
    );

    res.json({
      team,
    });
  } catch (error) {
    console.error("Add team member error:", error);

    res.status(500).json({
      message: "Failed to add team member",
    });
  }
};

const removeMember = async (req, res) => {
  try {
    const {
      teamId,
      userId,
    } = req.params;

    const team = await UserTeam.findById(teamId);
    const user = await User.findById(userId);

    if (!team || !user) {
      return res.status(404).json({
        message: "Team or user not found",
      });
    }

    team.members =
      team.members.filter(
        (id) =>
          id.toString() !== userId
      );

    user.teamIds =
      user.teamIds.filter(
        (id) =>
          id.toString() !== teamId
      );

    await team.save();
    await user.save();

    res.json({
      message: "Member removed",
    });
  } catch (error) {
    console.error(
      "Remove team member error:",
      error
    );

    res.status(500).json({
      message: "Failed to remove member",
    });
  }
};

module.exports = {
  getTeams,
  createTeam,
  addMember,
  removeMember,
};