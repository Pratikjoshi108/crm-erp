import { useEffect, useState } from "react";
import { apiRequest } from "./api";

function AutomationBuilder({
  crm,
  stages,
  onClose,
}) {
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] =
    useState("");

  const [triggerType, setTriggerType] =
    useState("stage_entered");

  const [triggerStage, setTriggerStage] =
    useState("");

  const [actionType, setActionType] =
    useState("create_reminder");

  const [delayMinutes, setDelayMinutes] =
    useState(0);

  const [reminderTitle, setReminderTitle] =
    useState("");

  const [reminderDescription, setReminderDescription] =
    useState("");

  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");

  const [targetStage, setTargetStage] = useState("");

  const [scheduledAt, setScheduledAt] = useState("");

  const loadAutomations = async () => {
    try {
      setLoading(true);

      const response =
        await apiRequest("/automations");

      setAutomations(
        response.automations || []
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAutomations();
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      setError(
        "Automation name is required."
      );
      return;
    }

    if (
  (triggerType === "stage_entered" ||
    triggerType === "stage_exited") &&
  !triggerStage
){
      setError(
        "Please select a trigger stage."
      );
      return;
    }

    if (
      actionType === "create_reminder" &&
      !reminderTitle.trim()
    ) {
      setError(
        "Reminder title is required."
      );
      return;
    }
    if (
  actionType === "send_notification" &&
  (!notificationTitle.trim() ||
    !notificationMessage.trim())
) {
  setError(
    "Notification title and message are required."
  );
  return;
}

if (
  actionType === "move_stage" &&
  !targetStage
) {
  setError(
    "Please select a target stage."
  );
  return;
}

if (
  triggerType === "scheduled" &&
  !scheduledAt
) {
  setError(
    "Please select a scheduled date and time."
  );
  return;
}

    try {
      setSaving(true);
      setError("");

      const response =
        await apiRequest("/automations", {
          method: "POST",
          body: JSON.stringify({
            crmId: crm._id,
            name: name.trim(),
            description:
              description.trim(),

            triggerType,

            triggerStage:
  triggerType === "stage_entered" ||
  triggerType === "stage_exited"
    ? triggerStage
    : null,

            actionType,

            actionConfig: {
  title: reminderTitle.trim(),
  description: reminderDescription.trim(),

  notificationTitle: notificationTitle.trim(),
  notificationMessage: notificationMessage.trim(),

  targetStage: targetStage || null,

  runAt: scheduledAt
    ? new Date(scheduledAt).toISOString()
    : null,
},

            delayMinutes:
              Number(delayMinutes) || 0,
          }),
        });

      setAutomations((previous) => [
        response.automation,
        ...previous,
      ]);

      setName("");
      setDescription("");
      setTriggerStage("");
      setDelayMinutes(0);
      setReminderTitle("");
      setReminderDescription("");
      setNotificationTitle("");
      setNotificationMessage("");
      setTargetStage("");
      setScheduledAt("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Delete this automation?"
      )
    ) {
      return;
    }

    try {
      await apiRequest(
        `/automations/${id}`,
        {
          method: "DELETE",
        }
      );

      setAutomations((previous) =>
        previous.filter(
          (automation) =>
            automation._id !== id
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDelay = (minutes) => {
    if (!minutes) {
      return "Immediately";
    }

    if (minutes < 60) {
      return `${minutes} minute${
        minutes === 1 ? "" : "s"
      }`;
    }

    const hours = minutes / 60;

    if (
      Number.isInteger(hours) &&
      hours < 24
    ) {
      return `${hours} hour${
        hours === 1 ? "" : "s"
      }`;
    }

    const days = minutes / 1440;

    if (Number.isInteger(days)) {
      return `${days} day${
        days === 1 ? "" : "s"
      }`;
    }

    return `${minutes} minutes`;
  };

  return (
    <div className="builder-overlay">
      <div className="builder-modal automation-modal">
        <div className="builder-header">
          <div>
            <h2>Automation Builder</h2>

            <p>
              Configure automated actions
              for {crm.name}.
            </p>
          </div>

          <button
            className="modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="automation-layout">
          <div className="automation-form-card">
            <h3>Create Automation</h3>

            <form onSubmit={handleCreate}>
              <label>
                Automation Name
              </label>

              <input
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="Follow up after site visit"
              />

              <label>
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
                placeholder="Explain what this automation does..."
                rows="3"
              />

              <label>
                Trigger
              </label>

              <select
                value={triggerType}
                onChange={(e) =>
                  setTriggerType(
                    e.target.value
                  )
                }
              >
                <option value="stage_entered">
                  Lead enters stage
                </option>

                <option value="lead_created">
                  Lead created
                </option>

                <option value="stage_exited">
                  Lead leaves stage
                </option>

                <option value="scheduled">
                  Scheduled
                </option>
              </select>
              {(triggerType === "stage_entered" || 
  triggerType === "stage_exited") && ( 
                <> 
                  <label> 
                    Trigger Stage 
                  </label> 
 
                  <select 
                    value={triggerStage} 
                    onChange={(e) => 
                      setTriggerStage( 
                        e.target.value 
                      ) 
                    } 
                  > 
                    <option value=""> 
                      Select stage 
                    </option> 
 
                    {stages.map((stage) => ( 
                      <option 
                        key={stage._id} 
                        value={stage._id} 
                      > 
                        {stage.name} 
                      </option> 
                    ))} 
                  </select> 
                </> 
              )}

              {triggerType === "scheduled" && (
                <>
                  <label>
                    Run At
                  </label>

                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) =>
                      setScheduledAt(e.target.value)
                    }
                  />
                </>
              )}
 
              <label> 
                Action 
              </label> 
 
              <select 
                value={actionType} 
                onChange={(e) => 
                  setActionType( 
                    e.target.value 
                  ) 
                } 
              >
                <option value="create_reminder">
                  Create reminder
                </option>

                <option value="send_notification">
                  Send notification
                </option>

                <option value="move_stage">
                  Move lead to stage
                </option>
              </select>

              {actionType ===
                "create_reminder" && (
                <>
                  <label>
                    Reminder Title
                  </label>

                  <input
                    value={reminderTitle}
                    onChange={(e) =>
                      setReminderTitle(
                        e.target.value
                      )
                    }
                    placeholder="Follow up with customer"
                  />

                  <label>
                    Reminder Description
                  </label>

                  <textarea
                    value={
                      reminderDescription
                    }
                    onChange={(e) =>
                      setReminderDescription(
                        e.target.value
                      )
                    }
                    placeholder="Call customer regarding site visit..."
                    rows="3"
                  />
                </>
              )}

              {actionType === "send_notification" && (
  <>
    <label>
      Notification Title
    </label>

    <input
      value={notificationTitle}
      onChange={(e) =>
        setNotificationTitle(e.target.value)
      }
      placeholder="Lead requires follow-up"
    />

    <label>
      Notification Message
    </label>

    <textarea
      value={notificationMessage}
      onChange={(e) =>
        setNotificationMessage(e.target.value)
      }
      placeholder="A lead has entered a stage that requires your attention."
      rows="3"
    />
  </>
)}
{actionType === "move_stage" && (
  <>
    <label>
      Target Stage
    </label>

    <select
      value={targetStage}
      onChange={(e) =>
        setTargetStage(e.target.value)
      }
    >
      <option value="">
        Select target stage
      </option>

      {stages.map((stage) => (
        <option
          key={stage._id}
          value={stage._id}
        >
          {stage.name}
        </option>
      ))}
    </select>
  </>
)}
{actionType === "send_notification" && (
  <>
    <label>
      Notification Title
    </label>

    <input
      value={notificationTitle}
      onChange={(e) =>
        setNotificationTitle(e.target.value)
      }
      placeholder="Lead requires follow-up"
    />

    <label>
      Notification Message
    </label>

    <textarea
      value={notificationMessage}
      onChange={(e) =>
        setNotificationMessage(e.target.value)
      }
      placeholder="A lead has entered a stage that requires your attention."
      rows="3"
    />
  </>
)}
{actionType === "move_stage" && (
  <>
    <label>
      Target Stage
    </label>

    <select
      value={targetStage}
      onChange={(e) =>
        setTargetStage(e.target.value)
      }
    >
      <option value="">
        Select target stage
      </option>

      {stages.map((stage) => (
        <option
          key={stage._id}
          value={stage._id}
        >
          {stage.name}
        </option>
      ))}
    </select>
  </>
)}

              <label>
                Delay
              </label>

              <div className="delay-grid">
                <button
                  type="button"
                  onClick={() =>
                    setDelayMinutes(0)
                  }
                  className={
                    delayMinutes === 0
                      ? "delay-option active"
                      : "delay-option"
                  }
                >
                  Immediately
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setDelayMinutes(15)
                  }
                  className={
                    delayMinutes === 15
                      ? "delay-option active"
                      : "delay-option"
                  }
                >
                  15 min
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setDelayMinutes(60)
                  }
                  className={
                    delayMinutes === 60
                      ? "delay-option active"
                      : "delay-option"
                  }
                >
                  1 hour
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setDelayMinutes(1440)
                  }
                  className={
                    delayMinutes === 1440
                      ? "delay-option active"
                      : "delay-option"
                  }
                >
                  1 day
                </button>
              </div>

              <div className="custom-delay">
                <label>
                  Custom delay (minutes)
                </label>

                <input
                  type="number"
                  min="0"
                  value={delayMinutes}
                  onChange={(e) =>
                    setDelayMinutes(
                      Number(e.target.value)
                    )
                  }
                />
              </div>

              <button
                type="submit"
                className="primary-button"
                disabled={saving}
              >
                {saving
                  ? "Creating..."
                  : "Create Automation"}
              </button>
            </form>
          </div>

          <div className="automation-list-card">
            <div className="section-heading">
              <div>
                <h3>
                  Existing Automations
                </h3>

                <p>
                  {automations.length} configured
                </p>
              </div>
            </div>

            {loading ? (
              <p>Loading automations...</p>
            ) : automations.length === 0 ? (
              <div className="empty-state">
                No automations configured yet.
              </div>
            ) : (
              <div className="automation-list">
                {automations.map(
                  (automation) => (
                    <div
                      className="automation-card"
                      key={automation._id}
                    >
                      <div className="automation-card-top">
                        <div>
                          <h4>
                            {automation.name}
                          </h4>

                          <p>
                            {
                              automation.description
                            }
                          </p>
                        </div>

                        <span className="status-badge">
                          {automation.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </div>

                      <div className="automation-flow">
                        <span>
                          {automation.triggerStage
                            ?.name ||
                            automation.triggerType}
                        </span>

                        <span>→</span>

                        <span>
                          {automation.actionType
                            .replace(
                              /_/g,
                              " "
                            )}
                        </span>
                      </div>

                      <div className="automation-meta">
                        <span>
                          Delay:{" "}
                          {formatDelay(
                            automation.delayMinutes
                          )}
                        </span>

                        <button
                          className="danger-button"
                          onClick={() =>
                            handleDelete(
                              automation._id
                            )
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AutomationBuilder;