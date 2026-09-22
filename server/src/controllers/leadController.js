const Lead = require("../models/Lead");
const CRM = require("../models/CRM");
const Stage = require("../models/Stage");
const Form = require("../models/Form");
const FormField = require("../models/FormField");
const StageHistory = require("../models/StageHistory");
const WorkflowConnection = require("../models/WorkflowConnection");
const User = require("../models/User");
const UserTeam = require("../models/UserTeam");

const validateFormData = async (stageId, formData) => {
  const form = await Form.findOne({
    stageId,
    isActive: true,
  });

  if (!form) {
    return {
      valid: true,
      errors: [],
    };
  }

  const fields = await FormField.find({
    formId: form._id,
    isActive: true,
  });

  const errors = [];

  for (const field of fields) {
    const value = formData[field.name];

    if (
      field.required &&
      (value === undefined ||
        value === null ||
        value === "")
    ) {
      errors.push(`${field.label} is required`);
      continue;
    }

    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      if (
        field.type === "number" &&
        typeof value !== "number"
      ) {
        errors.push(`${field.label} must be a number`);
      }

      if (
        field.type === "dropdown" &&
        field.options.length > 0 &&
        !field.options.includes(value)
      ) {
        errors.push(
          `${field.label} contains an invalid option`
        );
      }

      if (
        field.type === "multiselect" &&
        !Array.isArray(value)
      ) {
        errors.push(
          `${field.label} must contain multiple values`
        );
      }

      if (
        field.type === "multiselect" &&
        Array.isArray(value) &&
        field.options.length > 0
      ) {
        const invalidOptions = value.filter(
          (item) => !field.options.includes(item)
        );

        if (invalidOptions.length > 0) {
          errors.push(
            `${field.label} contains invalid options`
          );
        }
      }

      if (field.validation?.minLength) {
        if (
          typeof value === "string" &&
          value.length < field.validation.minLength
        ) {
          errors.push(
            `${field.label} is too short`
          );
        }
      }

      if (field.validation?.maxLength) {
        if (
          typeof value === "string" &&
          value.length > field.validation.maxLength
        ) {
          errors.push(
            `${field.label} is too long`
          );
        }
      }

      if (field.validation?.min !== undefined) {
        if (
          typeof value === "number" &&
          value < field.validation.min
        ) {
          errors.push(
            `${field.label} is below the minimum value`
          );
        }
      }

      if (field.validation?.max !== undefined) {
        if (
          typeof value === "number" &&
          value > field.validation.max
        ) {
          errors.push(
            `${field.label} exceeds the maximum value`
          );
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

const saveStageData = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { stageId, formData } = req.body;

    if (!stageId) {
      return res.status(400).json({
        message: "stageId is required",
      });
    }

    const lead = await Lead.findById(leadId);

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    const crm = await CRM.findOne({
      _id: lead.crmId,
      createdBy: req.user._id,
    });

    if (!crm) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    const stage = await Stage.findOne({
      _id: stageId,
      crmId: lead.crmId,
    });

    if (!stage) {
      return res.status(404).json({
        message: "Stage not found",
      });
    }

    if (lead.currentStage.toString() !== stageId.toString()) {
  return res.status(400).json({
    message: "You can only submit data for the lead's current stage"
  });
}

    const validation = await validateFormData(
      stageId,
      formData || {}
    );

    if (!validation.valid) {
      return res.status(400).json({
        message: "Form validation failed",
        errors: validation.errors,
      });
    }

    if (!lead.stageData) {
  lead.stageData = {};
}

lead.stageData[stageId] = formData || {};
lead.markModified("stageData");

await lead.save();

    res.status(200).json({
      message: "Stage data saved successfully",
      stageId,
      data: lead.stageData[stageId],
    });
  } catch (error) {
    console.error("Save stage data error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const assignLead = async (req, res) => {
  try {
    const { leadId } = req.params;

    const {
      assignedTo,
      assignedTeam,
    } = req.body;

    const lead = await Lead.findById(leadId);

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    if (assignedTo !== undefined) {
      if (assignedTo) {
        const user =
          await User.findById(assignedTo);

        if (!user) {
          return res.status(404).json({
            message: "Assigned user not found",
          });
        }
      }

      lead.assignedTo =
        assignedTo || null;
    }

    if (assignedTeam !== undefined) {
      if (assignedTeam) {
        const team =
          await UserTeam.findById(
            assignedTeam
          );

        if (!team) {
          return res.status(404).json({
            message: "Assigned team not found",
          });
        }
      }

      lead.assignedTeam =
        assignedTeam || null;
    }

    await lead.save();

    await lead.populate(
      "assignedTo",
      "name email role"
    );

    await lead.populate(
      "assignedTeam",
      "name"
    );

    res.json({
      lead,
    });
  } catch (error) {
    console.error(
      "Assign lead error:",
      error
    );

    res.status(500).json({
      message: "Failed to assign lead",
    });
  }
};

const createLead = async (req, res) => {
  try {
    const { crmId } = req.params;

    const {
      formData,
      assignedTo,
      notes,
      attachments,
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

    const initialStage = await Stage.findOne({
      crmId,
      isInitial: true,
    });

    if (!initialStage) {
      return res.status(400).json({
        message: "CRM does not have an initial stage",
      });
    }

    const validation = await validateFormData(
      initialStage._id,
      formData || {}
    );

    if (!validation.valid) {
      return res.status(400).json({
        message: "Form validation failed",
        errors: validation.errors,
      });
    }

    const lead = await Lead.create({
      crmId,
      currentStage: initialStage._id,
      assignedTo: assignedTo || null,
      formData: formData || {},
      notes: notes || "",
      attachments: attachments || [],
      createdBy: req.user._id,
    });

    await StageHistory.create({
      leadId: lead._id,
      fromStage: null,
      toStage: initialStage._id,
      changedBy: req.user._id,
      note: "Lead created",
    });

    const populatedLead = await Lead.findById(
      lead._id
    )
      .populate("currentStage", "name order")
      .populate("assignedTo", "name email");

    res.status(201).json({
      message: "Lead created successfully",
      lead: populatedLead,
    });
  } catch (error) {
    console.error("Create lead error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const getLeads = async (req, res) => {
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

    const leads = await Lead.find({
      crmId,
    })
      .populate("currentStage", "name order color")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      leads,
    });
  } catch (error) {
    console.error("Get leads error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const getLead = async (req, res) => {
  try {
    const { leadId } = req.params;

    const lead = await Lead.findById(leadId)
      .populate("currentStage", "name order color")
      .populate("assignedTo", "name email");

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    const crm = await CRM.findOne({
      _id: lead.crmId,
      createdBy: req.user._id,
    });

    if (!crm) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    const history = await StageHistory.find({
      leadId,
    })
      .populate("fromStage", "name")
      .populate("toStage", "name")
      .populate("changedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      lead,
      history,
    });
  } catch (error) {
    console.error("Get lead error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


const moveLead = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { toStage, note } = req.body;

    if (!toStage) {
      return res.status(400).json({
        message: "toStage is required",
      });
    }

    const lead = await Lead.findById(leadId);

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    const crm = await CRM.findOne({
      _id: lead.crmId,
      createdBy: req.user._id,
    });

    if (!crm) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    const currentStage = await Stage.findOne({
      _id: lead.currentStage,
      crmId: lead.crmId,
    });

    if (!currentStage) {
      return res.status(404).json({
        message: "Current stage not found",
      });
    }

    const targetStage = await Stage.findOne({
      _id: toStage,
      crmId: lead.crmId,
    });

    if (!targetStage) {
      return res.status(404).json({
        message: "Target stage not found",
      });
    }

    // Check whether the configured workflow allows this transition
    const connection = await WorkflowConnection.findOne({
      crmId: lead.crmId,
      fromStage: lead.currentStage,
      toStage,
    });

    if (!connection) {
      return res.status(400).json({
        message:
          "This stage transition is not allowed by the workflow",
      });
    }

    // Validate the form belonging to the CURRENT stage
    // before allowing the lead to leave that stage.
    let currentStageData = {};

    if (currentStage._id.toString() === lead.currentStage.toString()) {
      if (currentStage.isInitial) {
        // Initial stage uses the lead's original formData
        currentStageData = lead.formData || {};
      } else {
        // Other stages use stage-specific data
        currentStageData =
          (lead.stageData &&
            lead.stageData[currentStage._id.toString()]) ||
          {};
      }
    }

    const validation = await validateFormData(
      currentStage._id,
      currentStageData
    );

    if (!validation.valid) {
      return res.status(400).json({
        message:
          "Lead cannot leave this stage because required form data is missing",
        errors: validation.errors,
      });
    }

    const previousStage = lead.currentStage;

    lead.currentStage = toStage;

    if (targetStage.isFinal) {
      lead.status = "won";
    }

    await lead.save();

    await StageHistory.create({
      leadId: lead._id,
      fromStage: previousStage,
      toStage,
      changedBy: req.user._id,
      note: note || "",
    });

    const updatedLead = await Lead.findById(lead._id)
      .populate("currentStage", "name order color")
      .populate("assignedTo", "name email");

    res.status(200).json({
      message: "Lead moved successfully",
      lead: updatedLead,
    });
  } catch (error) {
    console.error("Move lead error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};



module.exports = {
  createLead,
  getLeads,
  getLead,
  moveLead,
  saveStageData,
  assignLead,
};