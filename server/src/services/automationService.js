const Automation = require("../models/Automation");
const Reminder = require("../models/Reminder");
const Lead = require("../models/Lead");
const StageHistory = require("../models/StageHistory");
const WorkflowConnection = require("../models/WorkflowConnection");
const { createNotification } = require("./notificationService");

const getId = (value) => {
  if (!value) return null;
  return value._id ? value._id.toString() : value.toString();
};

const getLeadName = (lead) => {
  if (!lead?.formData) return "Lead";

  return (
    lead.formData.fullName ||
    lead.formData.name ||
    lead.formData.customerName ||
    "Lead"
  );
};

const notifyLeadAssignee = async ({
  lead,
  title,
  message,
  type = "automation",
}) => {
  if (!lead?.assignedTo) return;

  await createNotification({
    userId: getId(lead.assignedTo),
    title,
    message,
    type,
    leadId: lead._id,
  });
};

const createAutomationReminder = async ({
  automation,
  lead,
}) => {
  const delayMinutes = Number(automation.delayMinutes || 0);

  const dueAt = new Date(
    Date.now() + delayMinutes * 60 * 1000
  );

  const title =
    automation.actionConfig?.title ||
    automation.name ||
    "Automated Reminder";

  const description =
    automation.actionConfig?.description ||
    `Reminder created by automation "${automation.name}".`;

  const existingReminder = await Reminder.findOne({
    leadId: lead._id,
    title,
    status: "pending",
  });

  if (existingReminder) {
    return existingReminder;
  }

  const reminder = await Reminder.create({
    crmId: lead.crmId,
    leadId: lead._id,
    assignedTo: lead.assignedTo || null,
    assignedTeam: lead.assignedTeam || null,
    title,
    description,
    dueAt,
    status: "pending",
    createdBy: automation.createdBy,
  });

  if (lead.assignedTo) {
    await notifyLeadAssignee({
      lead,
      title: "New reminder",
      message: `${title} has been scheduled for ${getLeadName(lead)}.`,
      type: "reminder",
    });
  }

  return reminder;
};

const sendAutomationNotification = async ({
  automation,
  lead,
}) => {
  const title =
    automation.actionConfig?.title ||
    automation.name ||
    "Automation Notification";

  const message =
    automation.actionConfig?.message ||
    `Automation "${automation.name}" was triggered for ${getLeadName(
      lead
    )}.`;

  if (lead.assignedTo) {
    await notifyLeadAssignee({
      lead,
      title,
      message,
      type: "automation",
    });
  }

  return true;
};

const moveLeadByAutomation = async ({
  automation,
  lead,
}) => {
  const targetStage =
    automation.actionConfig?.toStage ||
    automation.actionConfig?.targetStage;

  if (!targetStage) {
    throw new Error(
      `Automation "${automation.name}" has no target stage configured.`
    );
  }

  const connection = await WorkflowConnection.findOne({
    crmId: lead.crmId,
    fromStage: lead.currentStage,
    toStage: targetStage,
  });

  if (!connection) {
    throw new Error(
      `Automation cannot move lead because no workflow connection exists from the current stage.`
    );
  }

  const previousStage = lead.currentStage;

  lead.currentStage = targetStage;

  if (automation.actionConfig?.status) {
    lead.status = automation.actionConfig.status;
  }

  await lead.save();

  await StageHistory.create({
  leadId: lead._id,
  fromStage: previousStage,
  toStage: targetStage,
  changedBy: automation.createdBy,
  note:
    automation.actionConfig?.note ||
    `Moved automatically by automation "${automation.name}".`,
  automationExecutions: [],
});

  await notifyLeadAssignee({
    lead,
    title: "Lead stage updated",
    message: `${getLeadName(
      lead
    )} was automatically moved to a new stage.`,
    type: "stage_change",
  });

  return lead;
};

const executeAutomation = async ({
  automation,
  lead,
}) => {
  if (!automation || !lead) return null;

  switch (automation.actionType) {
    case "create_reminder":
      return createAutomationReminder({
        automation,
        lead,
      });

    case "send_notification":
      return sendAutomationNotification({
        automation,
        lead,
      });

    case "move_stage":
      return moveLeadByAutomation({
        automation,
        lead,
      });

    default:
      throw new Error(
        `Unsupported automation action: ${automation.actionType}`
      );
  }
};

const triggerAutomations = async ({
  crmId,
  triggerType,
  lead,
  stageId = null,
}) => {
  if (!crmId || !lead) return [];

  const query = {
    crmId,
    triggerType,
    isActive: true,
  };

  if (
    triggerType === "stage_entered" ||
    triggerType === "stage_exited"
  ) {
    if (!stageId) return [];

    query.triggerStage = stageId;
  }

  const automations = await Automation.find(query);

  const results = [];

  for (const automation of automations) {
    try {
      const result = await executeAutomation({
        automation,
        lead,
      });

      results.push({
        automation: automation._id,
        success: true,
        result,
      });
    } catch (error) {
      console.error(
        `Automation "${automation.name}" failed:`,
        error.message
      );

      results.push({
        automation: automation._id,
        success: false,
        error: error.message,
      });
    }
  }

  return results;
};

module.exports = {
  executeAutomation,
  triggerAutomations,
};