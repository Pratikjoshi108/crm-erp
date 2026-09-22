import { useState } from "react";
import { apiRequest } from "./api";

function WorkflowBuilder({
  crm,
  stages,
  connections,
  setConnections,
  onClose,
}) {
  const [showConnectionForm, setShowConnectionForm] =
    useState(false);

  const [fromStage, setFromStage] = useState("");
  const [toStage, setToStage] = useState("");
  const [connectionLabel, setConnectionLabel] =
    useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setFromStage("");
    setToStage("");
    setConnectionLabel("");
    setShowConnectionForm(false);
  };

  const openConnectionForm = () => {
    setError("");
    resetForm();
    setShowConnectionForm(true);
  };

  const handleCreateConnection = async (e) => {
    e.preventDefault();

    if (!fromStage || !toStage) {
      setError("Select both stages.");
      return;
    }

    if (fromStage === toStage) {
      setError("A stage cannot connect to itself.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await apiRequest(
        `/workflows/crm/${crm._id}`,
        {
          method: "POST",
          body: JSON.stringify({
            fromStage,
            toStage,
            label: connectionLabel.trim(),
          }),
        }
      );

      const newConnection =
        response.connection || response;

      setConnections((previous) => [
        ...previous,
        newConnection,
      ]);

      resetForm();
    } catch (err) {
      console.error(
        "Create workflow connection error:",
        err
      );

      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConnection = async (
    connection
  ) => {
    const confirmed = window.confirm(
      "Delete this workflow connection?"
    );

    if (!confirmed) return;

    try {
      await apiRequest(
        `/workflows/${connection._id}`,
        {
          method: "DELETE",
        }
      );

      setConnections((previous) =>
        previous.filter(
          (item) =>
            item._id !== connection._id
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const getStageName = (stageId) => {
    const id =
      typeof stageId === "object"
        ? stageId._id
        : stageId;

    return (
      stages.find((stage) => stage._id === id)
        ?.name || "Unknown Stage"
    );
  };

  return (
    <div className="builder-page workflow-builder-page">
      <div className="builder-header">
        <div>
          <button
            className="back-button"
            onClick={onClose}
          >
            ← Back to Dashboard
          </button>

          <span className="eyebrow">
            WORKFLOW CONFIGURATION
          </span>

          <h1>Workflow Builder</h1>

          <p>
            Connect stages and define how leads
            move through <strong>{crm.name}</strong>.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={openConnectionForm}
        >
          + Add Connection
        </button>
      </div>

      {error && (
        <div className="error-message builder-error">
          {error}
        </div>
      )}

      <div className="workflow-layout">
        <div className="workflow-canvas">
          <div className="canvas-header">
            <div>
              <h2>Workflow</h2>
              <span>
                {stages.length} stages ·{" "}
                {connections.length} connections
              </span>
            </div>
          </div>

          <div className="workflow-flow">
            {stages.length === 0 ? (
              <div className="workflow-empty">
                <h3>No stages configured</h3>

                <p>
                  Create stages before connecting
                  them.
                </p>
              </div>
            ) : (
              stages
                .sort(
                  (a, b) => a.order - b.order
                )
                .map((stage, index) => {
                  const outgoing =
                    connections.filter(
                      (connection) =>
                        getStageId(
                          connection.fromStage
                        ) === stage._id
                    );

                  return (
                    <div
                      className="workflow-stage-wrapper"
                      key={stage._id}
                    >
                      <div
                        className={`workflow-node ${
                          stage.isInitial
                            ? "workflow-node-initial"
                            : ""
                        } ${
                          stage.isFinal
                            ? "workflow-node-final"
                            : ""
                        }`}
                      >
                        <div className="workflow-node-number">
                          {index + 1}
                        </div>

                        <div>
                          <strong>
                            {stage.name}
                          </strong>

                          <span>
                            {stage.isInitial
                              ? "Initial stage"
                              : stage.isFinal
                              ? "Final stage"
                              : "Workflow stage"}
                          </span>
                        </div>
                      </div>

                      {outgoing.length > 0 && (
                        <div className="workflow-outgoing">
                          {outgoing.map(
                            (connection) => (
                              <div
                                className="workflow-arrow"
                                key={
                                  connection._id
                                }
                              >
                                <span className="arrow-line" />
                                <span className="arrow-head">
                                  →
                                </span>

                                <span className="connection-label">
                                  {connection.label ||
                                    "Continue"}
                                </span>

                                <span className="connection-target">
                                  {
                                    getStageName(
                                      connection.toStage
                                    )
                                  }
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        </div>

        <div className="workflow-sidebar">
          <div className="workflow-sidebar-card">
            <h3>Connections</h3>

            {connections.length === 0 ? (
              <p className="muted-text">
                No connections yet.
              </p>
            ) : (
              <div className="connection-list">
                {connections.map(
                  (connection) => (
                    <div
                      className="connection-card"
                      key={connection._id}
                    >
                      <div className="connection-route">
                        <strong>
                          {getStageName(
                            connection.fromStage
                          )}
                        </strong>

                        <span>→</span>

                        <strong>
                          {getStageName(
                            connection.toStage
                          )}
                        </strong>
                      </div>

                      {connection.label && (
                        <div className="connection-description">
                          {connection.label}
                        </div>
                      )}

                      <button
                        className="delete-stage-button"
                        onClick={() =>
                          handleDeleteConnection(
                            connection
                          )
                        }
                      >
                        Delete
                      </button>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showConnectionForm && (
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
                <h2>Add Workflow Connection</h2>

                <p>
                  Define a valid transition between
                  two stages.
                </p>
              </div>

              <button
                className="modal-close"
                onClick={resetForm}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleCreateConnection}
            >
              <label>From Stage</label>

              <select
                value={fromStage}
                onChange={(e) =>
                  setFromStage(e.target.value)
                }
              >
                <option value="">
                  Select starting stage
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

              <label>To Stage</label>

              <select
                value={toStage}
                onChange={(e) =>
                  setToStage(e.target.value)
                }
              >
                <option value="">
                  Select destination stage
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

              <label>Connection Label</label>

              <input
                type="text"
                value={connectionLabel}
                onChange={(e) =>
                  setConnectionLabel(
                    e.target.value
                  )
                }
                placeholder="e.g. Customer interested"
              />

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
                    : "Create Connection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function getStageId(stage) {
  return typeof stage === "object"
    ? stage._id
    : stage;
}

export default WorkflowBuilder;