const CRM = require("../models/CRM");

const createCRM = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "CRM name is required",
      });
    }

    const crm = await CRM.create({
      name,
      description,
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: "CRM created successfully",
      crm,
    });
  } catch (error) {
    console.error("Create CRM error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const getCRMs = async (req, res) => {
  try {
    const crms = await CRM.find({
      createdBy: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      crms,
    });
  } catch (error) {
    console.error("Get CRMs error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createCRM,
  getCRMs,
};