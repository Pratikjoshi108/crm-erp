import { useEffect, useState } from "react";
import { apiRequest } from "./api";

const FIELD_TYPES = [
  "text",
  "number",
  "email",
  "phone",
  "datetime",
  "dropdown",
  "multiselect",
  "checkbox",
  "radio",
  "file",
  "image",
  "location",
  "user",
];

function FormBuilder({
  crm,
  stage,
  onClose,
}) {
  const [form, setForm] = useState(null);
  const [fields, setFields] = useState([]);

  const [loading, setLoading] = useState(true);
  const [showFieldForm, setShowFieldForm] =
    useState(false);

  const [editingField, setEditingField] =
    useState(null);

  const [error, setError] = useState("");

  const [fieldLabel, setFieldLabel] =
    useState("");
  const [fieldName, setFieldName] =
    useState("");
  const [fieldType, setFieldType] =
    useState("text");
  const [required, setRequired] =
    useState(false);
  const [placeholder, setPlaceholder] =
    useState("");
  const [defaultValue, setDefaultValue] =
    useState("");
  const [options, setOptions] =
    useState("");
  const [minLength, setMinLength] =
    useState("");
  const [maxLength, setMaxLength] =
    useState("");
  const [minValue, setMinValue] =
    useState("");
  const [maxValue, setMaxValue] =
    useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadForm();
  }, [stage._id]);

  const loadForm = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest(
        `/forms/stage/${stage._id}`
      );

      setForm(response.form || null);
      setFields(response.fields || []);
    } catch (err) {
      console.error("Load form error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetFieldForm = () => {
    setEditingField(null);
    setFieldLabel("");
    setFieldName("");
    setFieldType("text");
    setRequired(false);
    setPlaceholder("");
    setDefaultValue("");
    setOptions("");
    setMinLength("");
    setMaxLength("");
    setMinValue("");
    setMaxValue("");
    setShowFieldForm(false);
  };

  const openCreateField = () => {
    resetFieldForm();
    setShowFieldForm(true);
  };

  const openEditField = (field) => {
    setEditingField(field);

    setFieldLabel(field.label || "");
    setFieldName(field.name || "");
    setFieldType(field.type || "text");
    setRequired(Boolean(field.required));
    setPlaceholder(field.placeholder || "");

    setDefaultValue(
      field.defaultValue === undefined ||
        field.defaultValue === null
        ? ""
        : String(field.defaultValue)
    );

    setOptions(
      Array.isArray(field.options)
        ? field.options.join(", ")
        : ""
    );

    setMinLength(
      field.validation?.minLength ?? ""
    );

    setMaxLength(
      field.validation?.maxLength ?? ""
    );

    setMinValue(
      field.validation?.min ?? ""
    );

    setMaxValue(
      field.validation?.max ?? ""
    );

    setShowFieldForm(true);
  };

  const ensureForm = async () => {
    if (form) return form;

    const response = await apiRequest(
      `/forms/stage/${stage._id}`,
      {
        method: "POST",
        body: JSON.stringify({
          name: `${stage.name} Form`,
          description: `Dynamic form for ${stage.name}`,
        }),
      }
    );

    const newForm = response.form || response;

    setForm(newForm);

    return newForm;
  };

  const handleSaveField = async (e) => {
    e.preventDefault();

    if (!fieldLabel.trim()) {
      setError("Field label is required.");
      return;
    }

    if (!fieldName.trim()) {
      setError("Field name is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const currentForm = await ensureForm();

      const fieldData = {
        label: fieldLabel.trim(),
        name: fieldName.trim(),
        type: fieldType,
        required,
        placeholder: placeholder.trim(),
        defaultValue:
          defaultValue.trim() || undefined,
        options:
          options.trim()
            ? options
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : [],
        validation: {
          ...(minLength !== ""
            ? {
                minLength: Number(minLength),
              }
            : {}),
          ...(maxLength !== ""
            ? {
                maxLength: Number(maxLength),
              }
            : {}),
          ...(minValue !== ""
            ? {
                min: Number(minValue),
              }
            : {}),
          ...(maxValue !== ""
            ? {
                max: Number(maxValue),
              }
            : {}),
        },
      };

      if (editingField) {
        const response = await apiRequest(
          `/forms/fields/${editingField._id}`,
          {
            method: "PUT",
            body: JSON.stringify(fieldData),
          }
        );

        const updatedField =
          response.field || response;

        setFields((previous) =>
          previous.map((field) =>
            field._id === editingField._id
              ? updatedField
              : field
          )
        );
      } else {
        const response = await apiRequest(
          `/${currentForm._id}/fields`,
          {
            method: "POST",
            body: JSON.stringify(fieldData),
          }
        );

        const newField =
          response.field || response;

        setFields((previous) =>
          [...previous, newField].sort(
            (a, b) => a.order - b.order
          )
        );
      }

      resetFieldForm();
    } catch (err) {
      console.error("Save field error:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteField = async (field) => {
    if (
      !window.confirm(
        `Delete "${field.label}"?`
      )
    ) {
      return;
    }

    try {
      await apiRequest(
        `/forms/fields/${field._id}`,
        {
          method: "DELETE",
        }
      );

      setFields((previous) =>
        previous
          .filter(
            (item) => item._id !== field._id
          )
          .map((item, index) => ({
            ...item,
            order: index,
          }))
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const moveField = async (index, direction) => {
    const newIndex =
      direction === "up"
        ? index - 1
        : index + 1;

    if (
      newIndex < 0 ||
      newIndex >= fields.length
    ) {
      return;
    }

    const current = fields[index];
    const target = fields[newIndex];

    try {
      await Promise.all([
        apiRequest(
          `/forms/fields/${current._id}`,
          {
            method: "PUT",
            body: JSON.stringify({
              order: target.order,
            }),
          }
        ),
        apiRequest(
          `/forms/fields/${target._id}`,
          {
            method: "PUT",
            body: JSON.stringify({
              order: current.order,
            }),
          }
        ),
      ]);

      const reordered = [...fields];

      reordered[index] = target;
      reordered[newIndex] = current;

      setFields(
        reordered.map((field, position) => ({
          ...field,
          order: position,
        }))
      );
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="builder-page">
        <button
          className="back-button"
          onClick={onClose}
        >
          ← Back
        </button>

        <div className="loading-state">
          Loading form...
        </div>
      </div>
    );
  }

  return (
    <div className="builder-page">
      <div className="builder-header">
        <div>
          <button
            className="back-button"
            onClick={onClose}
          >
            ← Back
          </button>

          <span className="eyebrow">
            FORM CONFIGURATION
          </span>

          <h1>{stage.name} Form</h1>

          <p>
            Configure the fields collected when
            a lead reaches this stage.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={openCreateField}
        >
          + Add Field
        </button>
      </div>

      {error && (
        <div className="error-message builder-error">
          {error}
        </div>
      )}

      <div className="form-builder-layout">
        <div className="dynamic-form-preview">
          <div className="form-preview-header">
            <div>
              <h2>Form Fields</h2>

              <span>
                {fields.length} configured fields
              </span>
            </div>
          </div>

          {fields.length === 0 ? (
            <div className="empty-builder">
              <h3>No fields configured</h3>

              <p>
                Add fields to create the dynamic
                stage form.
              </p>

              <button
                className="primary-button"
                onClick={openCreateField}
              >
                + Add Field
              </button>
            </div>
          ) : (
            <div className="field-list">
              {[...fields]
                .sort(
                  (a, b) => a.order - b.order
                )
                .map((field, index) => (
                  <div
                    className="field-builder-card"
                    key={field._id}
                  >
                    <div className="field-order">
                      {index + 1}
                    </div>

                    <div className="field-info">
                      <div className="field-title">
                        <strong>
                          {field.label}
                        </strong>

                        {field.required && (
                          <span className="required-badge">
                            Required
                          </span>
                        )}
                      </div>

                      <div className="field-meta">
                        <span>
                          {field.name}
                        </span>

                        <span>
                          {field.type}
                        </span>
                      </div>
                    </div>

                    <div className="field-actions">
                      <button
                        className="icon-button"
                        disabled={index === 0}
                        onClick={() =>
                          moveField(
                            index,
                            "up"
                          )
                        }
                      >
                        ↑
                      </button>

                      <button
                        className="icon-button"
                        disabled={
                          index ===
                          fields.length - 1
                        }
                        onClick={() =>
                          moveField(
                            index,
                            "down"
                          )
                        }
                      >
                        ↓
                      </button>

                      <button
                        className="edit-stage-button"
                        onClick={() =>
                          openEditField(field)
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="delete-stage-button"
                        onClick={() =>
                          handleDeleteField(
                            field
                          )
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="form-info-card">
          <h3>Stage</h3>

          <div className="form-stage-name">
            {stage.name}
          </div>

          <p>
            CRM: {crm.name}
          </p>

          <div className="form-stat">
            <strong>{fields.length}</strong>
            <span>Fields</span>
          </div>

          <div className="form-stat">
            <strong>
              {
                fields.filter(
                  (field) => field.required
                ).length
              }
            </strong>

            <span>Required</span>
          </div>
        </div>
      </div>

      {showFieldForm && (
        <div
          className="modal-overlay"
          onClick={resetFieldForm}
        >
          <div
            className="modal-card large-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <h2>
                  {editingField
                    ? "Edit Field"
                    : "Add Field"}
                </h2>

                <p>
                  Configure the field behavior.
                </p>
              </div>

              <button
                className="modal-close"
                onClick={resetFieldForm}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSaveField}
            >
              <div className="form-grid">
                <div>
                  <label>Field Label</label>

                  <input
                    value={fieldLabel}
                    onChange={(e) =>
                      setFieldLabel(
                        e.target.value
                      )
                    }
                    placeholder="Customer Name"
                    required
                  />
                </div>

                <div>
                  <label>Field Name</label>

                  <input
                    value={fieldName}
                    onChange={(e) =>
                      setFieldName(
                        e.target.value
                      )
                    }
                    placeholder="customerName"
                    required
                  />
                </div>
              </div>

              <label>Field Type</label>

              <select
                value={fieldType}
                onChange={(e) =>
                  setFieldType(e.target.value)
                }
              >
                {FIELD_TYPES.map((type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {type}
                  </option>
                ))}
              </select>

              <div className="form-grid">
                <div>
                  <label>
                    Placeholder
                  </label>

                  <input
                    value={placeholder}
                    onChange={(e) =>
                      setPlaceholder(
                        e.target.value
                      )
                    }
                    placeholder="Enter value..."
                  />
                </div>

                <div>
                  <label>
                    Default Value
                  </label>

                  <input
                    value={defaultValue}
                    onChange={(e) =>
                      setDefaultValue(
                        e.target.value
                      )
                    }
                    placeholder="Optional"
                  />
                </div>
              </div>

              {(fieldType === "dropdown" ||
                fieldType === "multiselect" ||
                fieldType === "radio") && (
                <div>
                  <label>
                    Options
                  </label>

                  <input
                    value={options}
                    onChange={(e) =>
                      setOptions(
                        e.target.value
                      )
                    }
                    placeholder="Option 1, Option 2, Option 3"
                  />

                  <small className="input-help">
                    Separate options with commas.
                  </small>
                </div>
              )}

              <div className="form-grid">
                <div>
                  <label>
                    Minimum Length
                  </label>

                  <input
                    type="number"
                    value={minLength}
                    onChange={(e) =>
                      setMinLength(
                        e.target.value
                      )
                    }
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label>
                    Maximum Length
                  </label>

                  <input
                    type="number"
                    value={maxLength}
                    onChange={(e) =>
                      setMaxLength(
                        e.target.value
                      )
                    }
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="form-grid">
                <div>
                  <label>
                    Minimum Value
                  </label>

                  <input
                    type="number"
                    value={minValue}
                    onChange={(e) =>
                      setMinValue(
                        e.target.value
                      )
                    }
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label>
                    Maximum Value
                  </label>

                  <input
                    type="number"
                    value={maxValue}
                    onChange={(e) =>
                      setMaxValue(
                        e.target.value
                      )
                    }
                    placeholder="Optional"
                  />
                </div>
              </div>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={required}
                  onChange={(e) =>
                    setRequired(
                      e.target.checked
                    )
                  }
                />

                Required field
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={resetFieldForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingField
                    ? "Save Changes"
                    : "Add Field"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FormBuilder;