import { useEffect, useState } from "react";
import { apiRequest } from "./api";

function LeadManagement({
  crm,
  stages,
  connections,
  onClose,
}) {
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  

  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] =
    useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadLeads();
  }, [crm._id]);

  


  const loadLeads = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest(
        `/leads/crm/${crm._id}`
      );

      setLeads(response.leads || []);
    } catch (err) {
      console.error("Load leads error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStageName = (stageId) => {
    const id =
      typeof stageId === "object"
        ? stageId._id
        : stageId;

    return (
      stages.find(
        (stage) => stage._id === id
      )?.name || "Unknown"
    );
  };

  if (selectedLead) {
    return (
      <LeadDetails
  lead={selectedLead}
  stages={stages}
  connections={connections}
  onBack={() =>
    setSelectedLead(null)
  }
        onUpdated={(updatedLead) => {
          setSelectedLead(updatedLead);

          setLeads((previous) =>
            previous.map((lead) =>
              lead._id === updatedLead._id
                ? updatedLead
                : lead
            )
          );
        }}
      />
    );
  }

  return (
    <div className="builder-page lead-page">
      <div className="builder-header">
        <div>
          <button
            className="back-button"
            onClick={onClose}
          >
            ← Back to Dashboard
          </button>

          <span className="eyebrow">
            CRM OPERATIONS
          </span>

          <h1>Leads</h1>

          <p>
            Manage leads for{" "}
            <strong>{crm.name}</strong>.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => {
            setError("");
            setShowCreate(true);
          }}
        >
          + Create Lead
        </button>
      </div>

      {error && (
        <div className="error-message builder-error">
          {error}
        </div>
      )}

      <div className="lead-summary">
        <div className="lead-summary-card">
          <span>Total Leads</span>
          <strong>{leads.length}</strong>
        </div>

        <div className="lead-summary-card">
          <span>Active</span>

          <strong>
            {
              leads.filter(
                (lead) =>
                  lead.status === "active"
              ).length
            }
          </strong>
        </div>

        <div className="lead-summary-card">
          <span>Won</span>

          <strong>
            {
              leads.filter(
                (lead) =>
                  lead.status === "won"
              ).length
            }
          </strong>
        </div>

        <div className="lead-summary-card">
          <span>Lost</span>

          <strong>
            {
              leads.filter(
                (lead) =>
                  lead.status === "lost"
              ).length
            }
          </strong>
        </div>
      </div>

      <div className="lead-table-card">
        {loading ? (
          <div className="loading-state">
            Loading leads...
          </div>
        ) : leads.length === 0 ? (
          <div className="empty-builder">
            <h3>No leads yet</h3>

            <p>
              Create your first lead for this
              CRM.
            </p>

            <button
              className="primary-button"
              onClick={() =>
                setShowCreate(true)
              }
            >
              + Create Lead
            </button>
          </div>
        ) : (
          <div className="lead-table">
            <div className="lead-table-header">
              <span>Lead</span>
              <span>Stage</span>
              <span>Status</span>
              <span>Created</span>
              <span></span>
            </div>

            {leads.map((lead) => (
              <div
                className="lead-table-row"
                key={lead._id}
              >
                <div>
                  <strong>
                    {getLeadName(lead)}
                  </strong>

                  <span>
                    {getLeadPhone(lead)}
                  </span>
                </div>

                <span className="stage-pill">
                  {getStageName(
                    lead.currentStage
                  )}
                </span>

                <span
                  className={`status-pill status-${lead.status}`}
                >
                  {lead.status}
                </span>

                <span className="date-text">
                  {lead.createdAt
                    ? new Date(
                        lead.createdAt
                      ).toLocaleDateString()
                    : "-"}
                </span>

                <button
                  className="edit-stage-button"
                  onClick={() =>
                    setSelectedLead(lead)
                  }
                >
                  Open
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateLeadModal
          crm={crm}
          stages={stages}
          onClose={() =>
            setShowCreate(false)
          }
          onCreated={(lead) => {
            setLeads((previous) => [
              lead,
              ...previous,
            ]);

            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}

function getLeadName(lead) {
  if (lead.formData) {
    return (
      lead.formData.fullName ||
      lead.formData.name ||
      lead.formData.customerName ||
      "Unnamed Lead"
    );
  }

  return "Unnamed Lead";
}

function getLeadPhone(lead) {
  if (lead.formData) {
    return (
      lead.formData.phone ||
      lead.formData.mobile ||
      ""
    );
  }

  return "";
}

function CreateLeadModal({
  crm,
  stages,
  onClose,
  onCreated,
}) {
  const initialStage =
    stages.find(
      (stage) => stage.isInitial
    ) || stages[0];

  const [form, setForm] = useState(null);
  const [fields, setFields] = useState([]);

  const [formData, setFormData] =
    useState({});

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (initialStage) {
      loadStageForm();
    } else {
      setLoading(false);
    }
  }, []);

  const loadStageForm = async () => {
    try {
      const response = await apiRequest(
        `/forms/stage/${initialStage._id}`
      );

      setForm(response.form || null);

      const configuredFields =
        response.fields || [];

      setFields(configuredFields);

      const defaults = {};

      configuredFields.forEach(
        (field) => {
          if (
            field.defaultValue !==
            undefined
          ) {
            defaults[field.name] =
              field.defaultValue;
          } else if (
            field.type ===
              "multiselect"
          ) {
            defaults[field.name] = [];
          } else if (
            field.type ===
            "checkbox"
          ) {
            defaults[field.name] =
              false;
          } else {
            defaults[field.name] = "";
          }
        }
      );

      setFormData(defaults);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (name, value) => {
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!initialStage) {
      setError(
        "This CRM does not have an initial stage."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await apiRequest(
        `/leads/crm/${crm._id}`,
        {
          method: "POST",
          body: JSON.stringify({
            currentStage:
              initialStage._id,
            formData,
          }),
        }
      );

      const newLead =
        response.lead || response;

      onCreated(newLead);
    } catch (err) {
      console.error(
        "Create lead error:",
        err
      );

      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal-card large-modal"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <div className="modal-header">
          <div>
            <h2>Create Lead</h2>

            <p>
              {initialStage
                ? `Initial stage: ${initialStage.name}`
                : "No initial stage configured"}
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

        {loading ? (
          <div className="loading-state">
            Loading form...
          </div>
        ) : fields.length === 0 ? (
          <div className="empty-builder">
            <h3>No form configured</h3>

            <p>
              Configure fields for the initial
              stage before creating leads.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {fields
              .sort(
                (a, b) => a.order - b.order
              )
              .map((field) => (
                <DynamicField
                  key={field._id}
                  field={field}
                  value={
                    formData[field.name]
                  }
                  onChange={(value) =>
                    updateField(
                      field.name,
                      value
                    )
                  }
                />
              ))}

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={onClose}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={saving}
              >
                {saving
                  ? "Creating..."
                  : "Create Lead"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function DynamicField({
  field,
  value,
  onChange,
}) {
  const label = (
    <label>
      {field.label}

      {field.required && (
        <span className="field-required">
          *
        </span>
      )}
    </label>
  );

  switch (field.type) {
    case "textarea":
    case "text":
      return (
        <div className="dynamic-field">
          {label}

          <input
            type="text"
            value={value ?? ""}
            placeholder={
              field.placeholder || ""
            }
            required={field.required}
            minLength={
              field.validation?.minLength
            }
            maxLength={
              field.validation?.maxLength
            }
            onChange={(e) =>
              onChange(e.target.value)
            }
          />
        </div>
      );

    case "number":
      return (
        <div className="dynamic-field">
          {label}

          <input
            type="number"
            value={value ?? ""}
            placeholder={
              field.placeholder || ""
            }
            required={field.required}
            min={field.validation?.min}
            max={field.validation?.max}
            onChange={(e) =>
              onChange(
                e.target.value === ""
                  ? ""
                  : Number(
                      e.target.value
                    )
              )
            }
          />
        </div>
      );

    case "email":
      return (
        <div className="dynamic-field">
          {label}

          <input
            type="email"
            value={value ?? ""}
            placeholder={
              field.placeholder || ""
            }
            required={field.required}
            onChange={(e) =>
              onChange(e.target.value)
            }
          />
        </div>
      );

    case "phone":
      return (
        <div className="dynamic-field">
          {label}

          <input
            type="tel"
            value={value ?? ""}
            placeholder={
              field.placeholder ||
              "Phone number"
            }
            required={field.required}
            onChange={(e) =>
              onChange(e.target.value)
            }
          />
        </div>
      );

    case "datetime":
      return (
        <div className="dynamic-field">
          {label}

          <input
            type="datetime-local"
            value={value ?? ""}
            required={field.required}
            onChange={(e) =>
              onChange(e.target.value)
            }
          />
        </div>
      );

    case "dropdown":
      return (
        <div className="dynamic-field">
          {label}

          <select
            value={value ?? ""}
            required={field.required}
            onChange={(e) =>
              onChange(e.target.value)
            }
          >
            <option value="">
              Select an option
            </option>

            {(field.options || []).map(
              (option) => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              )
            )}
          </select>
        </div>
      );

    case "radio":
      return (
        <div className="dynamic-field">
          {label}

          <div className="radio-options">
            {(field.options || []).map(
              (option) => (
                <label
                  className="radio-option"
                  key={option}
                >
                  <input
                    type="radio"
                    name={field.name}
                    value={option}
                    checked={
                      value === option
                    }
                    onChange={() =>
                      onChange(option)
                    }
                  />

                  {option}
                </label>
              )
            )}
          </div>
        </div>
      );

    case "multiselect":
      return (
        <div className="dynamic-field">
          {label}

          <div className="multi-options">
            {(field.options || []).map(
              (option) => {
                const selected =
                  Array.isArray(value) &&
                  value.includes(option);

                return (
                  <label
                    className="checkbox-label"
                    key={option}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => {
                        const current =
                          Array.isArray(
                            value
                          )
                            ? value
                            : [];

                        onChange(
                          selected
                            ? current.filter(
                                (item) =>
                                  item !==
                                  option
                              )
                            : [
                                ...current,
                                option,
                              ]
                        );
                      }}
                    />

                    {option}
                  </label>
                );
              }
            )}
          </div>
        </div>
      );

    case "checkbox":
      return (
        <div className="dynamic-field">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) =>
                onChange(
                  e.target.checked
                )
              }
            />

            {field.label}
          </label>
        </div>
      );

    case "file":
case "image":
  return (
    <div
      className="form-group"
      key={field._id}
    >
      {label}

      <input
        type="file"
        accept={
          field.type === "image"
            ? "image/*"
            : undefined
        }
        onChange={(e) => {
          const file =
            e.target.files?.[0];

          if (!file) {
            updateStageField(
              field.name,
              null
            );
            return;
          }

          const reader =
            new FileReader();

          reader.onload = () => {
            updateStageField(
              field.name,
              {
                name: file.name,
                type: file.type,
                size: file.size,
                data: reader.result,
              }
            );
          };

          reader.readAsDataURL(file);
        }}
      />

      {value?.name && (
        <small className="muted-text">
          Selected: {value.name}
        </small>
      )}
    </div>
  );
      return (
        <div className="dynamic-field">
          {label}

          <input
            type="file"
            accept={
              field.type === "image"
                ? "image/*"
                : undefined
            }
            onChange={(e) =>
              onChange(
                e.target.files?.[0] ||
                  null
              )
            }
          />
        </div>
      );

    case "location":
      return (
        <div className="dynamic-field">
          {label}

          <input
            type="text"
            value={value ?? ""}
            placeholder="Enter location"
            required={field.required}
            onChange={(e) =>
              onChange(e.target.value)
            }
          />
        </div>
      );

    case "user":
      return (
        <div className="dynamic-field">
          {label}

          <select
            value={value ?? ""}
            required={field.required}
            onChange={(e) =>
              onChange(e.target.value)
            }
          >
            <option value="">
              Select user
            </option>

            <option value="current-user">
              Current User
            </option>
          </select>
        </div>
      );

    default:
      return null;
  }
}

function LeadDetails({
  lead,
  stages,
  connections,
  onBack,
  onUpdated,
}) {
  const [targetStage, setTargetStage] =
    useState("");

  const [note, setNote] =
    useState("");

  const [history, setHistory] =
    useState([]);

    const [reminders, setReminders] =
  useState([]);

const [reminderTitle, setReminderTitle] =
  useState("");

const [reminderDescription, setReminderDescription] =
  useState("");

const [reminderDueAt, setReminderDueAt] =
  useState("");

const [reminderSaving, setReminderSaving] =
  useState(false);

  const [stageForm, setStageForm] = useState(null);
  const [stageFields, setStageFields] = useState([]);
  const [stageFormData, setStageFormData] = useState({});
  const [stageFormLoading, setStageFormLoading] = useState(true);
  const [stageFormSaving, setStageFormSaving] = useState(false);

  const [loading, setLoading] =
    useState(true);

  const [moving, setMoving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [users, setUsers] =
  useState([]);

const [teams, setTeams] =
  useState([]);

const [assignedUser, setAssignedUser] =
  useState("");

const [assignedTeam, setAssignedTeam] =
  useState("");

const [assigningLead, setAssigningLead] =
  useState(false);

  useEffect(() => {
  loadLead();
}, [lead._id]);

useEffect(() => {
  const stageId = getStageId(
    lead.currentStage
  );

  loadStageForm(stageId, lead);
}, [
  lead._id,
  lead.currentStage,
  lead.stageData,
]);

  useEffect(() => {
  loadUsersAndTeams();
}, []);

useEffect(() => {
  loadReminders();
}, [lead._id]);

  const loadUsersAndTeams = async () => {
  try {
    const [usersResponse, teamsResponse] =
      await Promise.all([
        apiRequest("/users"),
        apiRequest("/teams"),
      ]);

    setUsers(usersResponse.users || []);
    setTeams(teamsResponse.teams || []);
  } catch (err) {
    console.error(
      "Failed to load users and teams:",
      err
    );
  }
};

const loadReminders = async () => {
  try {
    const response = await apiRequest(
      `/reminders?leadId=${lead._id}`
    );

    setReminders(response.reminders || []);
  } catch (err) {
    console.error(
      "Failed to load reminders:",
      err
    );
  }
};

const handleCreateReminder = async () => {
  if (!reminderTitle.trim()) {
    setError("Reminder title is required.");
    return;
  }

  if (!reminderDueAt) {
    setError("Reminder date and time are required.");
    return;
  }

  try {
    setReminderSaving(true);
    setError("");

    const response = await apiRequest("/reminders", {
      method: "POST",
      body: JSON.stringify({
        leadId: lead._id,
        title: reminderTitle.trim(),
        description: reminderDescription.trim(),
        dueAt: new Date(reminderDueAt).toISOString(),
      }),
    });

    const newReminder =
      response.reminder || response;

    setReminders((previous) => [
      newReminder,
      ...previous,
    ]);

    setReminderTitle("");
    setReminderDescription("");
    setReminderDueAt("");
  } catch (err) {
    setError(err.message);
  } finally {
    setReminderSaving(false);
  }
};

  const loadLead = async () => {
    try {
      const response =
        await apiRequest(
          `/leads/${lead._id}`
        );

      const loadedLead =
        response.lead || response;

      onUpdated(loadedLead);

setHistory(
  response.stageHistory || []
);

await loadStageForm(
  getStageId(loadedLead.currentStage),
  loadedLead
);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStageForm = async (stageId, currentLead) => {
  if (!stageId) {
    setStageForm(null);
    setStageFields([]);
    setStageFormData({});
    setStageFormLoading(false);
    return;
  }

  setStageFormLoading(true);

  try {
    const response = await apiRequest(
      `/forms/stage/${stageId}`
    );

    const configuredFields =
      response.fields || [];

    setStageForm(response.form || null);
    setStageFields(configuredFields);

    const existingData =
      currentLead?.stageData?.[stageId] || {};

    const defaults = {};

    configuredFields.forEach((field) => {
      if (
        existingData[field.name] !== undefined
      ) {
        defaults[field.name] =
          existingData[field.name];
      } else if (
        field.defaultValue !== undefined
      ) {
        defaults[field.name] =
          field.defaultValue;
      } else if (
        field.type === "multiselect"
      ) {
        defaults[field.name] = [];
      } else if (
        field.type === "checkbox"
      ) {
        defaults[field.name] = false;
      } else {
        defaults[field.name] = "";
      }
    });

    setStageFormData(defaults);
  } catch (err) {
    // A stage may legitimately have no form yet.
    setStageForm(null);
    setStageFields([]);
    setStageFormData({});
  } finally {
    setStageFormLoading(false);
  }
};

  const getStageName = (stageId) => {
    const id =
      typeof stageId === "object"
        ? stageId._id
        : stageId;

    return (
      stages.find(
        (stage) => stage._id === id
      )?.name || "Unknown"
    );
  };

  const updateStageField = (
  fieldName,
  value
) => {
  setStageFormData((previous) => ({
    ...previous,
    [fieldName]: value,
  }));
};

const saveStageData = async () => {
  setStageFormSaving(true);
  setError("");

  try {
    const response = await apiRequest(
      `/leads/${lead._id}/stage-data`,
      {
        method: "PUT",
        body: JSON.stringify({
          formData: stageFormData,
        }),
      }
    );

    const updatedLead =
      response.lead || response;

    onUpdated(updatedLead);

    setStageFormData(
      updatedLead.stageData?.[
        getStageId(updatedLead.currentStage)
      ] || stageFormData
    );
  } catch (err) {
    setError(err.message);
  } finally {
    setStageFormSaving(false);
  }
};

const renderStageField = (field) => {
  const value =
    stageFormData[field.name];

  const label = (
    <label>
      {field.label}
      {field.required && (
        <span className="required-mark">
          *
        </span>
      )}
    </label>
  );

  switch (field.type) {
    case "text":
    case "email":
    case "phone":
    case "number":
      return (
        <div
          className="form-group"
          key={field._id}
        >
          {label}

          <input
            type={
              field.type === "number"
                ? "number"
                : field.type === "email"
                ? "email"
                : "text"
            }
            value={value ?? ""}
            placeholder={
              field.placeholder || ""
            }
            onChange={(e) =>
              updateStageField(
                field.name,
                e.target.value
              )
            }
          />
        </div>
      );

    case "datetime":
      return (
        <div
          className="form-group"
          key={field._id}
        >
          {label}

          <input
            type="datetime-local"
            value={value ?? ""}
            onChange={(e) =>
              updateStageField(
                field.name,
                e.target.value
              )
            }
          />
        </div>
      );

    case "dropdown":
    case "radio":
      return (
        <div
          className="form-group"
          key={field._id}
        >
          {label}

          <select
            value={value ?? ""}
            onChange={(e) =>
              updateStageField(
                field.name,
                e.target.value
              )
            }
          >
            <option value="">
              Select...
            </option>

            {(field.options || []).map(
              (option) => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              )
            )}
          </select>
        </div>
      );

    case "multiselect":
      return (
        <div
          className="form-group"
          key={field._id}
        >
          {label}

          <select
            multiple
            value={value || []}
            onChange={(e) => {
              const selected =
                Array.from(
                  e.target.selectedOptions
                ).map(
                  (option) => option.value
                );

              updateStageField(
                field.name,
                selected
              );
            }}
          >
            {(field.options || []).map(
              (option) => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              )
            )}
          </select>
        </div>
      );

    case "checkbox":
      return (
        <div
          className="form-group"
          key={field._id}
        >
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) =>
                updateStageField(
                  field.name,
                  e.target.checked
                )
              }
            />

            {field.label}
          </label>
        </div>
      );

    case "location":
      return (
        <div
          className="form-group"
          key={field._id}
        >
          {label}

          <input
            type="text"
            value={value ?? ""}
            placeholder="Enter location"
            onChange={(e) =>
              updateStageField(
                field.name,
                e.target.value
              )
            }
          />
        </div>
      );

    case "file":
    case "image":
      return (
        <div
          className="form-group"
          key={field._id}
        >
          {label}

          <input
            type="file"
            accept={
              field.type === "image"
                ? "image/*"
                : undefined
            }
            onChange={(e) =>
              updateStageField(
                field.name,
                e.target.files?.[0] || null
              )
            }
          />
        </div>
      );

    case "user":
  return (
    <div
      className="form-group"
      key={field._id}
    >
      {label}

      <select
        value={value ?? ""}
        onChange={(e) =>
          updateStageField(
            field.name,
            e.target.value
          )
        }
      >
        <option value="">
          Select user
        </option>

        {users.map((user) => (
          <option
            key={user._id}
            value={user._id}
          >
            {user.name} ({user.email})
          </option>
        ))}
      </select>
    </div>
  );

    default:
      return null;
  }
};

  const moveLead = async () => {
  if (!targetStage) {
    setError(
      "Select a destination stage."
    );
    return;
  }

  setMoving(true);
  setError("");

  try {
    const response =
      await apiRequest(
        `/leads/${lead._id}/move`,
        {
          method: "PUT",
          body: JSON.stringify({
            toStage: targetStage,
            note: note.trim(),
          }),
        }
      );

    const updatedLead =
  response.lead || response;

onUpdated(updatedLead);

setTargetStage("");
setNote("");

// Load the form for the new stage
await loadStageForm(
  getStageId(updatedLead.currentStage),
  updatedLead
);

await loadLead();
  } catch (err) {
    setError(err.message);
  } finally {
    setMoving(false);
  }
};

const handleAssignLead = async () => {
  if (!assignedUser && !assignedTeam) {
    setError(
      "Please select a user or team."
    );
    return;
  }

  setAssigningLead(true);
  setError("");

  try {
    const response =
      await apiRequest(
        `/leads/${lead._id}/assignment`,
        {
          method: "PUT",
          body: JSON.stringify({
            assignedTo:
              assignedUser || null,
            assignedTeam:
              assignedTeam || null,
          }),
        }
      );

    const updatedLead =
      response.lead || response;

    onUpdated(updatedLead);

    setAssignedUser("");
    setAssignedTeam("");

    await loadLead();
  } catch (err) {
    setError(err.message);
  } finally {
    setAssigningLead(false);
  }
};

  return (
    <div className="builder-page lead-detail-page">
      <button
        className="back-button"
        onClick={onBack}
      >
        ← Back to Leads
      </button>

      <div className="lead-detail-header">
        <div>
          <span className="eyebrow">
            LEAD DETAILS
          </span>

          <h1>
            {getLeadName(lead)}
          </h1>

          <p>
            {getLeadPhone(lead)}
          </p>
        </div>

        <span
          className={`status-pill status-${lead.status}`}
        >
          {lead.status}
        </span>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="lead-detail-grid">

  
  <div className="lead-detail-card">
    <div className="form-preview-header">
      <div>
        <h3>
          {getStageName(lead.currentStage)} Details
        </h3>

        <span>
          Stage-specific information
        </span>
      </div>
    </div>

    {stageFormLoading ? (
      <div className="loading-state">
        Loading stage form...
      </div>
    ) : !stageForm ? (
      <div className="empty-builder">
        <h3>No form configured</h3>

        <p>
          No dynamic form has been configured
          for this stage yet.
        </p>
      </div>
    ) : stageFields.length === 0 ? (
      <div className="empty-builder">
        <h3>No fields configured</h3>

        <p>
          This stage has a form but no fields
          have been added yet.
        </p>
      </div>
    ) : (
      <>
        <div className="dynamic-stage-form">
          {[...stageFields]
            .sort(
              (a, b) => a.order - b.order
            )
            .map(renderStageField)}
        </div>

        <button
          className="primary-button"
          disabled={stageFormSaving}
          onClick={saveStageData}
        >
          {stageFormSaving
            ? "Saving..."
            : "Save Stage Details"}
        </button>
      </>
    )}
  </div>
        
        <div className="lead-detail-card">
          <h3>Current Stage</h3>

          <div className="current-stage-box">
            {getStageName(
              lead.currentStage
            )}
          </div>

          <label>
            Move to stage
          </label>

          <select
            value={targetStage}
            onChange={(e) =>
              setTargetStage(
                e.target.value
              )
            }
          >
            <option value="">
              Select destination
            </option>

            {connections
  .filter((connection) => {
    const fromStageId =
      typeof connection.fromStage === "object"
        ? connection.fromStage._id
        : connection.fromStage;

    return (
      fromStageId ===
      getStageId(lead.currentStage)
    );
  })
  .map((connection) => {
    const toStageId =
      typeof connection.toStage === "object"
        ? connection.toStage._id
        : connection.toStage;

    const targetStage = stages.find(
      (stage) => stage._id === toStageId
    );

    if (!targetStage) return null;

    return (
      <option
        key={connection._id}
        value={targetStage._id}
      >
        {targetStage.name}
        {connection.label
          ? ` — ${connection.label}`
          : ""}
      </option>
    );
  })}
          </select>

          <label>
            Transition Note
          </label>

          <textarea
            value={note}
            onChange={(e) =>
              setNote(e.target.value)
            }
            rows="3"
            placeholder="Optional note"
          />

          <button
            className="primary-button"
            disabled={moving}
            onClick={moveLead}
          >
            {moving
              ? "Moving..."
              : "Move Lead"}
          </button>
        </div>

        <div className="lead-detail-card">
          <h3>Form Data</h3>

          <div className="lead-data-list">
            {Object.entries(
              lead.formData || {}
            ).map(([key, value]) => (
              <div
                className="lead-data-row"
                key={key}
              >
                <span>{key}</span>

                <strong>
                  {Array.isArray(value)
                    ? value.join(", ")
                    : String(
                        value ?? "-"
                      )}
                </strong>
              </div>
            ))}
          </div>
        </div>

                <div className="lead-assignment-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                ASSIGNMENT
              </span>

              <h3>Assign Lead</h3>
            </div>
          </div>

          <div className="assignment-grid">

            <div className="form-group">
              <label>
                Assign to User
              </label>

              <select
                value={assignedUser}
                onChange={(e) => {
                  setAssignedUser(
                    e.target.value
                  );

                  if (e.target.value) {
                    setAssignedTeam("");
                  }
                }}
              >
                <option value="">
                  Select user
                </option>

                {users.map((user) => (
                  <option
                    key={user._id}
                    value={user._id}
                  >
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>
                Assign to Team
              </label>

              <select
                value={assignedTeam}
                onChange={(e) => {
                  setAssignedTeam(
                    e.target.value
                  );

                  if (e.target.value) {
                    setAssignedUser("");
                  }
                }}
              >
                <option value="">
                  Select team
                </option>

                {teams.map((team) => (
                  <option
                    key={team._id}
                    value={team._id}
                  >
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

          </div>

          <button
            className="primary-button"
            disabled={assigningLead}
            onClick={handleAssignLead}
          >
            {assigningLead
              ? "Assigning..."
              : "Assign Lead"}
          </button>
        </div>

        <div className="lead-detail-card">
  <div className="section-heading">
    <div>
      <h3>Reminders</h3>
      <p>Create and track follow-up reminders for this lead.</p>
    </div>
  </div>

  <div className="reminder-form">
    <label>Reminder Title</label>

    <input
      type="text"
      value={reminderTitle}
      onChange={(e) =>
        setReminderTitle(e.target.value)
      }
      placeholder="Follow up with customer"
    />

    <label>Description</label>

    <textarea
      value={reminderDescription}
      onChange={(e) =>
        setReminderDescription(e.target.value)
      }
      placeholder="Call customer regarding the next step..."
      rows="3"
    />

    <label>Due Date & Time</label>

    <input
      type="datetime-local"
      value={reminderDueAt}
      onChange={(e) =>
        setReminderDueAt(e.target.value)
      }
    />

    <button
      type="button"
      className="primary-button"
      onClick={handleCreateReminder}
      disabled={reminderSaving}
    >
      {reminderSaving
        ? "Creating..."
        : "Create Reminder"}
    </button>
  </div>

  <div className="reminder-list">
    {reminders.length === 0 ? (
      <div className="empty-state">
        No reminders created for this lead.
      </div>
    ) : (
      reminders.map((reminder) => (
        <div
          className="reminder-item"
          key={reminder._id}
        >
          <div>
            <strong>
              {reminder.title}
            </strong>

            {reminder.description && (
              <p>
                {reminder.description}
              </p>
            )}

            <small>
              Due:{" "}
              {reminder.dueAt
                ? new Date(
                    reminder.dueAt
                  ).toLocaleString()
                : "-"}
            </small>
          </div>

          <div className="reminder-actions">
  <span
    className={`status-pill status-${reminder.status}`}
  >
    {reminder.status}
  </span>

  {reminder.status === "pending" && (
    <button
      type="button"
      className="secondary-button"
      onClick={async () => {
        try {
          await apiRequest(
            `/reminders/${reminder._id}`,
            {
              method: "PUT",
              body: JSON.stringify({
                status: "completed",
              }),
            }
          );

          await loadReminders();
        } catch (err) {
          setError(err.message);
        }
      }}
    >
      Complete
    </button>
  )}
</div>
        </div>
      ))
    )}
  </div>
</div>

        <div className="lead-detail-card history-card">
          <h3>Stage History</h3>

          {loading ? (
            <div className="loading-state">
              Loading history...
            </div>
          ) : history.length === 0 ? (
            <p className="muted-text">
              No history available.
            </p>
          ) : (
            <div className="timeline">
              {history.map((item) => (
                <div
                  className="timeline-item"
                  key={item._id}
                >
                  <div className="timeline-dot" />

                  <div>
                    <strong>
                      {item.fromStage
                        ? getStageName(
                            item.fromStage
                          )
                        : "Created"}
                    </strong>

                    <span>
                      →
                    </span>

                    <strong>
                      {getStageName(
                        item.toStage
                      )}
                    </strong>

                    {item.note && (
                      <p>
                        {item.note}
                      </p>
                    )}

                    <small>
                      {item.createdAt
                        ? new Date(
                            item.createdAt
                          ).toLocaleString()
                        : ""}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getStageId(stage) {
  return typeof stage === "object"
    ? stage._id
    : stage;
}


export default LeadManagement;