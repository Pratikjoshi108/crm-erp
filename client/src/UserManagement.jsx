import { useEffect, useState } from "react";
import { apiRequest } from "./api";

function UserManagement({ onClose }) {
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);

  const [teamName, setTeamName] =
    useState("");

  const [showTeamForm, setShowTeamForm] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [userResponse, teamResponse] =
        await Promise.all([
          apiRequest("/users"),
          apiRequest("/teams"),
        ]);

      setUsers(userResponse.users || []);
      setTeams(teamResponse.teams || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const createTeam = async (e) => {
    e.preventDefault();

    if (!teamName.trim()) return;

    try {
      const response =
        await apiRequest("/teams", {
          method: "POST",
          body: JSON.stringify({
            name: teamName.trim(),
          }),
        });

      setTeams((previous) => [
        response.team,
        ...previous,
      ]);

      setTeamName("");
      setShowTeamForm(false);
    } catch (err) {
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
            ADMINISTRATION
          </span>

          <h1>Users & Teams</h1>

          <p>
            Manage users, roles and teams.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() =>
            setShowTeamForm(true)
          }
        >
          + Create Team
        </button>
      </div>

      {error && (
        <div className="error-message builder-error">
          {error}
        </div>
      )}

      <div className="admin-management-grid">
        <div className="management-card">
          <h2>Users</h2>

          <div className="management-list">
            {users.map((user) => (
              <div
                className="management-row"
                key={user._id}
              >
                <div>
                  <strong>
                    {user.name}
                  </strong>

                  <span>
                    {user.email}
                  </span>
                </div>

                <span className="role-badge">
                  {user.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="management-card">
          <h2>Teams</h2>

          <div className="management-list">
            {teams.length === 0 ? (
              <p className="muted-text">
                No teams created yet.
              </p>
            ) : (
              teams.map((team) => (
                <div
                  className="management-row"
                  key={team._id}
                >
                  <div>
                    <strong>
                      {team.name}
                    </strong>

                    <span>
                      {team.members?.length || 0}{" "}
                      members
                    </span>
                  </div>

                  <span className="role-badge">
                    Team
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showTeamForm && (
        <div
          className="modal-overlay"
          onClick={() =>
            setShowTeamForm(false)
          }
        >
          <div
            className="modal-card"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <h2>Create Team</h2>

                <p>
                  Create a team for lead
                  assignment.
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setShowTeamForm(false)
                }
              >
                ×
              </button>
            </div>

            <form onSubmit={createTeam}>
              <label>Team Name</label>

              <input
                value={teamName}
                onChange={(e) =>
                  setTeamName(
                    e.target.value
                  )
                }
                placeholder="Sales Team"
                required
              />

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowTeamForm(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;