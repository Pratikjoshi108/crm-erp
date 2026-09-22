const Automation = require("../models/Automation");
const CRM = require("../models/CRM");
const Stage = require("../models/Stage");

const getAutomations = async (req, res) => {
  try {
    const automations =
      await Automation.find({
        createdBy: req.user._id,
      })
        .populate("triggerStage", "name")
        .sort({ createdAt: -1 });

    res.json({ automations });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const createAutomation = async (req, res) => {
  try {
    const {
      crmId,
      name,
      description,
      triggerType,
      triggerStage,
      actionType,
      actionConfig,
      delayMinutes,
    } = req.body;

    const crm = await CRM.findOne({
      _id: crmId,
      createdBy: req.user._id,
    });

    if (!crm) {
      return res.status(404).json({
        message: "CRM not found",
      });
    }

    if (triggerStage) {
      const stage = await Stage.findOne({
        _id: triggerStage,
        crmId,
      });

      if (!stage) {
        return res.status(400).json({
          message:
            "Trigger stage does not belong to this CRM",
        });
      }
    }

    const automation =
      await Automation.create({
        crmId,
        name,
        description,
        triggerType,
        triggerStage:
          triggerStage || null,
        actionType,
        actionConfig:
          actionConfig || {},
        delayMinutes:
          Number(delayMinutes) || 0,
        createdBy: req.user._id,
      });

    res.status(201).json({
      automation,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const updateAutomation = async (req, res) => {
  try {
    const automation =
      await Automation.findOne({
        _id: req.params.id,
        createdBy: req.user._id,
      });

    if (!automation) {
      return res.status(404).json({
        message: "Automation not found",
      });
    }

    const allowedFields = [
      "name",
      "description",
      "triggerType",
      "triggerStage",
      "actionType",
      "actionConfig",
      "delayMinutes",
      "isActive",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        automation[field] =
          req.body[field];
      }
    });

    await automation.save();

    res.json({
      automation,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const deleteAutomation = async (req, res) => {
  try {
    const automation =
      await Automation.findOne({
        _id: req.params.id,
        createdBy: req.user._id,
      });

    if (!automation) {
      return res.status(404).json({
        message: "Automation not found",
      });
    }

    await automation.deleteOne();

    res.json({
      message: "Automation deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getAutomations,
  createAutomation,
  updateAutomation,
  deleteAutomation,
};