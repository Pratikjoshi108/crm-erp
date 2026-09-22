const Form = require("../models/Form");
const FormField = require("../models/FormField");
const CRM = require("../models/CRM");
const Stage = require("../models/Stage");

const createForm = async (req, res) => {
  try {
    const { stageId } = req.params;
    const {
      name,
      description,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Form name is required",
      });
    }

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

    const existingForm = await Form.findOne({
      stageId,
    });

    if (existingForm) {
      return res.status(409).json({
        message: "A form already exists for this stage",
        form: existingForm,
      });
    }

    const form = await Form.create({
      crmId: stage.crmId,
      stageId,
      name,
      description,
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: "Form created successfully",
      form,
    });
  } catch (error) {
    console.error("Create form error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const getForm = async (req, res) => {
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

    const form = await Form.findOne({
      stageId,
      isActive: true,
    });

    if (!form) {
      return res.status(404).json({
        message: "Form not found",
      });
    }

    const fields = await FormField.find({
      formId: form._id,
      isActive: true,
    }).sort({ order: 1 });

    res.status(200).json({
      form,
      fields,
    });
  } catch (error) {
    console.error("Get form error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const addField = async (req, res) => {
  try {
    const { formId } = req.params;

    const {
      label,
      name,
      type,
      required,
      placeholder,
      defaultValue,
      options,
      validation,
    } = req.body;

    if (!label || !name || !type) {
      return res.status(400).json({
        message: "label, name and type are required",
      });
    }

    const form = await Form.findById(formId);

    if (!form) {
      return res.status(404).json({
        message: "Form not found",
      });
    }

    const crm = await CRM.findOne({
      _id: form.crmId,
      createdBy: req.user._id,
    });

    if (!crm) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    const existingField = await FormField.findOne({
      formId,
      name,
    });

    if (existingField) {
      return res.status(409).json({
        message: "A field with this name already exists",
      });
    }

    const lastField = await FormField.findOne({
      formId,
    }).sort({ order: -1 });

    const nextOrder = lastField
      ? lastField.order + 1
      : 0;

    const field = await FormField.create({
      formId,
      label,
      name,
      type,
      required: required || false,
      placeholder,
      defaultValue,
      options: options || [],
      validation: validation || {},
      order: nextOrder,
    });

    res.status(201).json({
      message: "Form field created successfully",
      field,
    });
  } catch (error) {
    console.error("Add form field error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const updateField = async (req, res) => {
  try {
    const { fieldId } = req.params;

    const field = await FormField.findById(fieldId);

    if (!field) {
      return res.status(404).json({
        message: "Form field not found",
      });
    }

    const form = await Form.findById(field.formId);

    if (!form) {
      return res.status(404).json({
        message: "Form not found",
      });
    }

    const crm = await CRM.findOne({
      _id: form.crmId,
      createdBy: req.user._id,
    });

    if (!crm) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    const allowedFields = [
      "label",
      "name",
      "type",
      "required",
      "placeholder",
      "defaultValue",
      "options",
      "validation",
      "isActive",
      "order",
    ];

    allowedFields.forEach((key) => {
      if (req.body[key] !== undefined) {
        field[key] = req.body[key];
      }
    });

    await field.save();

    res.status(200).json({
      message: "Form field updated successfully",
      field,
    });
  } catch (error) {
    console.error("Update form field error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const deleteField = async (req, res) => {
  try {
    const { fieldId } = req.params;

    const field = await FormField.findById(fieldId);

    if (!field) {
      return res.status(404).json({
        message: "Form field not found",
      });
    }

    const form = await Form.findById(field.formId);

    if (!form) {
      return res.status(404).json({
        message: "Form not found",
      });
    }

    const crm = await CRM.findOne({
      _id: form.crmId,
      createdBy: req.user._id,
    });

    if (!crm) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    await FormField.findByIdAndDelete(fieldId);

    res.status(200).json({
      message: "Form field deleted successfully",
    });
  } catch (error) {
    console.error("Delete form field error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createForm,
  getForm,
  addField,
  updateField,
  deleteField,
};