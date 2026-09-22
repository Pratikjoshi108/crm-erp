const cron = require("node-cron");

const Automation = require("../models/Automation");
const Lead = require("../models/Lead");
const StageHistory = require("../models/StageHistory");
const { executeAutomation } = require("./automationService");

let schedulerStarted = false;

const getId = (value) => {
  if (!value) return null;
  return value._id ? value._id.toString() : value.toString();
};


const processStageEnteredAutomations = async () => {
  const automations = await Automation.find({
    triggerType: "stage_entered",
    isActive: true,
  });

  if (!automations.length) return;

  const recentHistories = await StageHistory.find({
    toStage: {
      $in: automations
        .map((automation) => automation.triggerStage)
        .filter(Boolean),
    },
    createdAt: {
      $gte: new Date(Date.now() - 2 * 60 * 1000),
    },
  }).populate("leadId");

  for (const history of recentHistories) {
    const lead = history.leadId;

    if (!lead) continue;

    for (const automation of automations) {
      if (
        getId(history.toStage) !==
        getId(automation.triggerStage)
      ) {
        continue;
      }

      if (
        getId(lead.currentStage) !==
        getId(automation.triggerStage)
      ) {
        continue;
      }

      const executionKey =
        `${automation._id}:${history._id}`;

      history.automationExecutions =
        history.automationExecutions || [];

      if (
        history.automationExecutions.includes(
          executionKey
        )
      ) {
        continue;
      }

      try {
        await executeAutomation({
          automation,
          lead,
        });

        history.automationExecutions.push(
          executionKey
        );

        await history.save();

        console.log(
          `Automation executed: ${automation.name}`
        );
      } catch (error) {
        console.error(
          `Stage-entered automation "${automation.name}" failed:`,
          error.message
        );
      }
    }
  }
};


const processLeadCreatedAutomations = async () => {
  const automations = await Automation.find({
    triggerType: "lead_created",
    isActive: true,
  });

  if (!automations.length) return;

  const recentLeads = await Lead.find({
    createdAt: {
      $gte: new Date(Date.now() - 2 * 60 * 1000),
    },
  });

  for (const lead of recentLeads) {
    for (const automation of automations) {
      if (
        getId(automation.crmId) !==
        getId(lead.crmId)
      ) {
        continue;
      }

      const executionKey =
        `lead_created:${automation._id}:${lead._id}`;

      const existingHistory =
        await StageHistory.findOne({
          leadId: lead._id,
          automationExecutions: executionKey,
        });

      if (existingHistory) {
        continue;
      }

      try {
        await executeAutomation({
          automation,
          lead,
        });

        let history = await StageHistory.findOne({
          leadId: lead._id,
        }).sort({ createdAt: -1 });

        if (!history) {
          history = await StageHistory.create({
            leadId: lead._id,
            fromStage: null,
            toStage: lead.currentStage,
            changedBy: automation.createdBy,
            note: "Lead created.",
          });
        }

        history.automationExecutions =
          history.automationExecutions || [];

        history.automationExecutions.push(
          executionKey
        );

        await history.save();

        console.log(
          `Lead-created automation executed: ${automation.name}`
        );
      } catch (error) {
        console.error(
          `Lead-created automation "${automation.name}" failed:`,
          error.message
        );
      }
    }
  }
};

const processScheduledAutomations = async () => {
  const automations = await Automation.find({
    triggerType: "scheduled",
    isActive: true,
  });

  if (!automations.length) return;

  const now = new Date();

  for (const automation of automations) {
    const runAt =
      automation.actionConfig?.runAt;

    if (!runAt) continue;

    const scheduledTime = new Date(runAt);

    if (Number.isNaN(scheduledTime.getTime())) {
      continue;
    }

    if (scheduledTime > now) {
      continue;
    }

    const leads = await Lead.find({
      crmId: automation.crmId,
    });

    for (const lead of leads) {
      const executionKey =
        `scheduled:${automation._id}:${lead._id}`;

      const existingHistory =
        await StageHistory.findOne({
          leadId: lead._id,
          automationExecutions: executionKey,
        });

      if (existingHistory) {
        continue;
      }

      try {
        await executeAutomation({
          automation,
          lead,
        });

        let history = await StageHistory.findOne({
          leadId: lead._id,
        }).sort({ createdAt: -1 });

        if (!history) {
          history = await StageHistory.create({
            leadId: lead._id,
            fromStage: null,
            toStage: lead.currentStage,
            changedBy: automation.createdBy,
            note: "Scheduled automation execution.",
          });
        }

        history.automationExecutions =
          history.automationExecutions || [];

        history.automationExecutions.push(
          executionKey
        );

        await history.save();

        console.log(
          `Scheduled automation executed: ${automation.name}`
        );
      } catch (error) {
        console.error(
          `Scheduled automation "${automation.name}" failed:`,
          error.message
        );
      }
    }

    automation.isActive = false;
    await automation.save();

    console.log(
      `Scheduled automation completed: ${automation.name}`
    );
  }
};


const processStageExitedAutomations = async () => {
  const automations = await Automation.find({
    triggerType: "stage_exited",
    isActive: true,
  });

  if (!automations.length) return;

  const recentHistories = await StageHistory.find({
    fromStage: {
      $in: automations
        .map((automation) => automation.triggerStage)
        .filter(Boolean),
    },
    createdAt: {
      $gte: new Date(Date.now() - 2 * 60 * 1000),
    },
  }).populate("leadId");

  for (const history of recentHistories) {
    const lead = history.leadId;

    if (!lead) continue;

    for (const automation of automations) {
      if (
        getId(history.fromStage) !==
        getId(automation.triggerStage)
      ) {
        continue;
      }

      if (
        getId(lead.currentStage) ===
        getId(automation.triggerStage)
      ) {
        continue;
      }

      const executionKey =
        `${automation._id}:${history._id}`;

      history.automationExecutions =
        history.automationExecutions || [];

      if (
        history.automationExecutions.includes(
          executionKey
        )
      ) {
        continue;
      }

      try {
        await executeAutomation({
          automation,
          lead,
        });

        history.automationExecutions.push(
          executionKey
        );

        await history.save();

        console.log(
          `Stage-exited automation executed: ${automation.name}`
        );
      } catch (error) {
        console.error(
          `Stage-exited automation "${automation.name}" failed:`,
          error.message
        );
      }
    }
  }
};

const processAutomations = async () => {
  try {
    console.log("Running automation scheduler...");

    await processStageEnteredAutomations();
    await processStageExitedAutomations();
    await processLeadCreatedAutomations();
    await processScheduledAutomations();
  } catch (error) {
    console.error(
      "Automation scheduler error:",
      error.message
    );
  }
};


const startScheduler = () => {
  if (schedulerStarted) {
    console.log("Automation scheduler already started.");
    return;
  }

  schedulerStarted = true;

  cron.schedule("* * * * *", async () => {
    await processAutomations();
  });

  console.log("Automation scheduler started");
};

module.exports = {
  startScheduler,
  processAutomations,
};