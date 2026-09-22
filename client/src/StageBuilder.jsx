import { useState } from "react";
import { apiRequest } from "./api";

function StageBuilder({ crm, stages, setStages, onClose, onOpenFormBuilder, }) {
  const [showForm, setShowForm] = useState(false);
  const [editingStage, setEditingStage] = useState(null);

  const [stageName, setStageName] = useState("");
  const [description, setDescription] = useState("");
  const [isInitial, setIsInitial] = useState(false);
  const [isFinal, setIsFinal] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setStageName("");
    setDescription("");
    setIsInitial(false);
    setIsFinal(false);
    setEditingStage(null);
    setShowForm(false);
  };

  const openCreateForm = () => {
    setError("");
    setEditingStage(null);
    setStageName("");
    setDescription("");
    setIsInitial(false);
    setIsFinal(false);
    setShowForm(true);
  };

  const openEditForm = (stage) => {
    setError("");

    setEditingStage(stage);
    setStageName(stage.name || "");
    setDescription(stage.description || "");
    setIsInitial(Boolean(stage.isInitial));
    setIsFinal(Boolean(stage.isFinal));

    setShowForm(true);
  };

  const handleSaveStage = async (e) => {
    e.preventDefault();

    if (!stageName.trim()) {
      setError("Stage name is required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (editingStage) {
        const response = await apiRequest(
          `/stages/${editingStage._id}`,
          {
            method: "PUT",
            body: JSON.stringify({
              name: stageName.trim(),
              description: description.trim(),
              isInitial,
              isFinal,
            }),
          }
        );

        const updatedStage =
          response.stage || response;

        setStages((previous) =>
          previous.map((stage) =>
            stage._id === editingStage._id
              ? updatedStage
              : stage
          )
        );
      } else {
        const response = await apiRequest(
          `/stages/crm/${crm._id}`,
          {
            method: "POST",
            body: JSON.stringify({
              name: stageName.trim(),
              description: description.trim(),
              isInitial,
              isFinal,
            }),
          }
        );

        const newStage =
          response.stage || response;

        setStages((previous) =>
          [...previous, newStage].sort(
            (a, b) => a.order - b.order
          )
        );
      }

      resetForm();
    } catch (err) {
      console.error("Stage save error:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStage = async (stage) => {
    const confirmed = window.confirm(
      `Delete "${stage.name}"? This cannot be undone.`
    );

    if (!confirmed) return;

    setError("");

    try {
      await apiRequest(`/stages/${stage._id}`, {
        method: "DELETE",
      });

      setStages((previous) =>
        previous
          .filter(
            (item) => item._id !== stage._id
          )
          .map((item, index) => ({
            ...item,
            order: index,
          }))
      );
    } catch (err) {
      console.error("Delete stage error:", err);
      setError(err.message);
    }
  };

  const moveStage = async (index, direction) => {
    const newIndex =
      direction === "up"
        ? index - 1
        : index + 1;

    if (
      newIndex < 0 ||
      newIndex >= stages.length
    ) {
      return;
    }

    const currentStage = stages[index];
    const targetStage = stages[newIndex];

    setError("");

    try {
      await Promise.all([
        apiRequest(
          `/stages/${currentStage._id}`,
          {
            method: "PUT",
            body: JSON.stringify({
              order: targetStage.order,
            }),
          }
        ),

        apiRequest(
          `/stages/${targetStage._id}`,
          {
            method: "PUT",
            body: JSON.stringify({
              order: currentStage.order,
            }),
          }
        ),
      ]);

      const reordered = [...stages];

      reordered[index] = targetStage;
      reordered[newIndex] = currentStage;

      setStages(
        reordered.map((stage, position) => ({
          ...stage,
          order: position,
        }))
      );
    } catch (err) {
      console.error(
        "Reorder stage error:",
        err
      );

      setError(err.message);
    }
  };

  return (
    <div className="builder-page">
      <div className="builder-header">
        <div>
          <button
            className="back-button"
            onClick={onClose}
          >
            ← Back to Dashboard
          </button>

          <span className="eyebrow">
            CRM CONFIGURATION
          </span>

          <h1>Stage Builder</h1>

          <p>
            Configure stages for{" "}
            <strong>{crm.name}</strong>.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={openCreateForm}
        >
          + Add Stage
        </button>
      </div>

      {error && (
        <div className="error-message builder-error">
          {error}
        </div>
      )}

      <div className="stages-container">
        {stages.length === 0 ? (
          <div className="empty-builder">
            <h3>No stages yet</h3>

            <p>
              Add the first stage to this CRM
              workflow.
            </p>

            <button
              className="primary-button"
              onClick={openCreateForm}
            >
              + Add First Stage
            </button>
          </div>
        ) : (
          stages
            .sort((a, b) => a.order - b.order)
            .map((stage, index) => (
              <div
                className="stage-builder-card"
                key={stage._id}
              >
                <div className="stage-number">
                  {index + 1}
                </div>

                <div className="stage-builder-content">
                  <div className="stage-builder-title">
                    <h3>{stage.name}</h3>

                    {stage.isInitial && (
                      <span className="stage-badge initial-badge">
                        Initial
                      </span>
                    )}

                    {stage.isFinal && (
                      <span className="stage-badge final-badge">
                        Final
                      </span>
                    )}
                  </div>

                  <p>
                    {stage.description ||
                      "No description provided"}
                  </p>
                </div>

                <div className="stage-order">
                  Order {stage.order}
                </div>

                <div className="stage-actions">
  <button
    className="icon-button"
    title="Move up"
    disabled={index === 0}
    onClick={() =>
      moveStage(index, "up")
    }
  >
    ↑
  </button>

  <button
    className="icon-button"
    title="Move down"
    disabled={
      index === stages.length - 1
    }
    onClick={() =>
      moveStage(index, "down")
    }
  >
    ↓
  </button>

  <button
    className="edit-stage-button"
    onClick={() =>
      openEditForm(stage)
    }
  >
    Edit
  </button>

  <button
    className="edit-stage-button"
    onClick={() =>
      onOpenFormBuilder(stage)
    }
  >
    Form
  </button>

  <button
    className="delete-stage-button"
    onClick={() =>
      handleDeleteStage(stage)
    }
  >
    Delete
  </button>
</div>
              </div>
            ))
        )}
      </div>

      {showForm && (
        <div
          className="modal-overlay"
          onClick={resetForm}
        >
          <div
            className="modal-card"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <h2>
                  {editingStage
                    ? "Edit Stage"
                    : "Add Stage"}
                </h2>

                <p>
                  Configure this workflow stage.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={resetForm}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveStage}>
              <label>Stage Name</label>

              <input
                type="text"
                value={stageName}
                onChange={(e) =>
                  setStageName(e.target.value)
                }
                placeholder="e.g. Qualified"
                required
              />

              <label>Description</label>

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
                placeholder="Describe this stage"
                rows="3"
              />

              <div className="checkbox-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isInitial}
                    onChange={(e) =>
                      setIsInitial(
                        e.target.checked
                      )
                    }
                  />

                  Initial stage
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isFinal}
                    onChange={(e) =>
                      setIsFinal(
                        e.target.checked
                      )
                    }
                  />

                  Final stage
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={resetForm}
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
                    : editingStage
                    ? "Save Changes"
                    : "Create Stage"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StageBuilder;