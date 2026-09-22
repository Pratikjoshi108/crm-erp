const WorkflowConnection = require("../models/WorkflowConnection");
const CRM = require("../models/CRM");
const Stage = require("../models/Stage");

const createConnection = async (req, res) => {
  try {
    const { crmId } = req.params;
    const {
      fromStage,
      toStage,
      label,
      condition,
    } = req.body;

    if (!fromStage || !toStage) {
      return res.status(400).json({
        message: "fromStage and toStage are required",
      });
    }

    if (fromStage === toStage) {
      return res.status(400).json({
        message: "A stage cannot connect to itself",
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

    const sourceStage = await Stage.findOne({
      _id: fromStage,
      crmId,
    });

    const targetStage = await Stage.findOne({
      _id: toStage,
      crmId,
    });

    if (!sourceStage || !targetStage) {
      return res.status(404).json({
        message: "One or both stages not found in this CRM",
      });
    }

    const existingConnection =
      await WorkflowConnection.findOne({
        crmId,
        fromStage,
        toStage,
      });

    if (existingConnection) {
      return res.status(409).json({
        message: "Connection already exists",
      });
    }

    const connection = await WorkflowConnection.create({
      crmId,
      fromStage,
      toStage,
      label,
      condition,
    });

    res.status(201).json({
      message: "Workflow connection created successfully",
      connection,
    });
  } catch (error) {
    console.error("Create workflow connection error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const getConnections = async (req, res) => {
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

    const connections = await WorkflowConnection.find({
      crmId,
    })
      .populate("fromStage", "name order")
      .populate("toStage", "name order")
      .sort({ order: 1 });

    res.status(200).json({
      connections,
    });
  } catch (error) {
    console.error("Get workflow connections error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const deleteConnection = async (req, res) => {
  try {
    const { connectionId } = req.params;

    const connection =
      await WorkflowConnection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({
        message: "Connection not found",
      });
    }

    const crm = await CRM.findOne({
      _id: connection.crmId,
      createdBy: req.user._id,
    });

    if (!crm) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    await WorkflowConnection.findByIdAndDelete(
      connectionId
    );

    res.status(200).json({
      message: "Workflow connection deleted successfully",
    });
  } catch (error) {
    console.error("Delete workflow connection error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createConnection,
  getConnections,
  deleteConnection,
};