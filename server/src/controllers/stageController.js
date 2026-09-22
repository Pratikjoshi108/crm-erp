const Stage = require("../models/Stage");
const CRM = require("../models/CRM");

const createStage = async (req, res) => {
  try {
    const { crmId } = req.params;
    const {
      name,
      description,
      color,
      isInitial,
      isFinal,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Stage name is required",
      });
    }

    const crm = await CRM.findOne({
      _id: crmId,
      createdBy: req.user._id,
    });

    if (!crm) {
      return res.status(404).json({
        message: "CRM not found",
      });
    }

    const lastStage = await Stage.findOne({ crmId })
      .sort({ order: -1 });

    const nextOrder = lastStage
      ? lastStage.order + 1
      : 0;

    if (isInitial) {
      await Stage.updateMany(
        { crmId },
        { $set: { isInitial: false } }
      );
    }

    const stage = await Stage.create({
      crmId,
      name,
      description,
      color,
      order: nextOrder,
      isInitial: isInitial || false,
      isFinal: isFinal || false,
    });

    res.status(201).json({
      message: "Stage created successfully",
      stage,
    });
  } catch (error) {
    console.error("Create stage error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const getStages = async (req, res) => {
  try {
    const { crmId } = req.params;

    const crm = await CRM.findOne({
      _id: crmId,
      createdBy: req.user._id,
    });

    if (!crm) {
      return res.status(404).json({
        message: "CRM not found",
      });
    }

    const stages = await Stage.find({ crmId })
      .sort({ order: 1 });

    res.status(200).json({
      stages,
    });
  } catch (error) {
    console.error("Get stages error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const updateStage = async (req, res) => {
  try {
    const { stageId } = req.params;

    const stage = await Stage.findById(stageId);

    if (!stage) {
      return res.status(404).json({
        message: "Stage not found",
      });
    }

    const crm = await CRM.findOne({
      _id: stage.crmId,
      createdBy: req.user._id,
    });

    if (!crm) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    const {
      name,
      description,
      color,
      isInitial,
      isFinal,
    } = req.body;

    if (isInitial) {
      await Stage.updateMany(
        {
          crmId: stage.crmId,
          _id: { $ne: stageId },
        },
        {
          $set: { isInitial: false },
        }
      );
    }

    if (name !== undefined) stage.name = name;
    if (description !== undefined) stage.description = description;
    if (color !== undefined) stage.color = color;
    if (isInitial !== undefined) stage.isInitial = isInitial;
    if (isFinal !== undefined) stage.isFinal = isFinal;

    await stage.save();

    res.status(200).json({
      message: "Stage updated successfully",
      stage,
    });
  } catch (error) {
    console.error("Update stage error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const deleteStage = async (req, res) => {
  try {
    const { stageId } = req.params;

    const stage = await Stage.findById(stageId);

    if (!stage) {
      return res.status(404).json({
        message: "Stage not found",
      });
    }

    const crm = await CRM.findOne({
      _id: stage.crmId,
      createdBy: req.user._id,
    });

    if (!crm) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    await Stage.findByIdAndDelete(stageId);

    res.status(200).json({
      message: "Stage deleted successfully",
    });
  } catch (error) {
    console.error("Delete stage error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createStage,
  getStages,
  updateStage,
  deleteStage,
};