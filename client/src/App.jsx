import { useEffect, useState } from "react";
import { apiRequest } from "./api";
import StageBuilder from "./StageBuilder";
import WorkflowBuilder from "./WorkflowBuilder";
import FormBuilder from "./FormBuilder";
import LeadManagement from "./LeadManagement";
import UserManagement from "./UserManagement";
import AutomationBuilder from "./AutomationBuilder";
import useNotifications from "./useNotifications";
import * as XLSX from "xlsx";
import "./App.css";

const API_URL = "http://localhost:5000/api";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const {
  notifications,
  unreadCount,
  markAsRead,
  markAllAsRead,
} = useNotifications();

  const [email, setEmail] = useState("admin@crm.com");
  const [password, setPassword] = useState("Test123456");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [crms, setCrms] = useState([]);
  const [selectedCRM, setSelectedCRM] = useState(null);
  const [stages, setStages] = useState([]);
  const [connections, setConnections] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardLeads, setDashboardLeads] =
  useState([]);

const [dashboardReminders, setDashboardReminders] =
  useState([]);
  const [showStageBuilder, setShowStageBuilder] = useState(false);
  const [showWorkflowBuilder, setShowWorkflowBuilder] = useState(false);
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [showLeadManagement, setShowLeadManagement] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showAutomationBuilder, setShowAutomationBuilder] = useState(false);

  const [selectedStageForForm, setSelectedStageForForm] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

  
  const [showCreateCRM, setShowCreateCRM] = useState(false);
  const [crmName, setCrmName] = useState("");
  const [crmDescription, setCrmDescription] = useState("");
  const [creatingCRM, setCreatingCRM] = useState(false);

  // Load CRM + stages + workflows
  const loadCRMData = async () => {
  setDashboardLoading(true);
  setError("");

  try {
    const crmResponse = await apiRequest("/crms");
    const crmData = crmResponse.crms || [];

    setCrms(crmData);

    if (crmData.length > 0) {
      const crm = crmData[0];

      setSelectedCRM(crm);

      const [
  stageResponse,
  workflowResponse,
  leadResponse,
  reminderResponse,
] = await Promise.all([
  apiRequest(`/stages/crm/${crm._id}`),
  apiRequest(`/workflows/crm/${crm._id}`),
  apiRequest(`/leads/crm/${crm._id}`),
  apiRequest(`/reminders?crmId=${crm._id}`),
]);

setStages(stageResponse.stages || []);
setConnections(
  workflowResponse.connections || []
);

setDashboardLeads(
  leadResponse.leads || []
);

setDashboardReminders(
  reminderResponse.reminders || []
);
        
    } else {
      setSelectedCRM(null);
      setStages([]);
      setConnections([]);
    }
  } catch (err) {
    console.error("Failed to load CRM data:", err);
    setError(err.message);
  } finally {
    setDashboardLoading(false);
  }
};
  // Load data after login
  useEffect(() => {
    if (token) {
      loadCRMData();
    }
  }, [token]);

  // Create CRM
  const handleCreateCRM = async (e) => {
    e.preventDefault();

    if (!crmName.trim()) {
      setError("CRM name is required");
      return;
    }

    setCreatingCRM(true);
    setError("");

    try {
      const response = await apiRequest("/crms", {
  method: "POST",
  body: JSON.stringify({
    name: crmName.trim(),
    description: crmDescription.trim(),
  }),
});

const newCRM = response.crm || response;

setCrms((previous) => [...previous, newCRM]);
setSelectedCRM(newCRM);

      setStages([]);
      setConnections([]);

      setCrmName("");
      setCrmDescription("");
      setShowCreateCRM(false);
    } catch (err) {
      console.error("Failed to create CRM:", err);
      setError(err.message);
    } finally {
      setCreatingCRM(false);
    }
  };

  // Login
  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

     localStorage.setItem("token", data.token);
localStorage.setItem("user", JSON.stringify(data.user));
setToken(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  setToken(null);
};

  // Login screen
  if (!token) {
    return (
      <div className="auth-page">
        <div className="login-card">
          <div className="brand">
            <div className="brand-mark">D</div>

            <div>
              <h1>D-Table CRM</h1>
              <p>Dynamic CRM & Workflow Platform</p>
            </div>
          </div>

          <div className="login-header">
            <h2>Welcome back</h2>
            <p>Sign in to manage your CRM workflows.</p>
          </div>

          <form onSubmit={handleLogin}>
            <label>Email</label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />

            <label>Password</label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button
              className="primary-button"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const totalLeads = dashboardLeads.length;

const activeLeads = dashboardLeads.filter(
  (lead) => lead.status === "active"
).length;

const exportLeads = dashboardLeads.map((lead) => ({
  "Lead ID": lead._id || "",
  "Lead Name":
    lead.formData?.name ||
    lead.formData?.fullName ||
    lead.formData?.customerName ||
    "Unnamed Lead",
  "Phone":
    lead.formData?.phone ||
    lead.formData?.mobile ||
    "",
  "Stage":
    lead.currentStage?.name ||
    "N/A",
  "Status": lead.status || "",
  "Assigned User":
    lead.assignedTo?.name ||
    lead.assignedTo?.email ||
    "",
  "Assigned Team":
    lead.assignedTeam?.name ||
    "",
  "Created At": lead.createdAt
    ? new Date(lead.createdAt).toLocaleString()
    : "",
}));

const handleExportCSV = () => {
  if (!exportLeads.length) {
    alert("No leads available to export.");
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(exportLeads);
  const csv = XLSX.utils.sheet_to_csv(worksheet);

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${selectedCRM?.name || "crm"}-leads.csv`;
  link.click();

  URL.revokeObjectURL(url);
};

const handleExportExcel = () => {
  if (!exportLeads.length) {
    alert("No leads available to export.");
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(exportLeads);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

  XLSX.writeFile(
    workbook,
    `${selectedCRM?.name || "crm"}-leads.xlsx`
  );
};

const wonLeads = dashboardLeads.filter(
  (lead) => lead.status === "won"
).length;

const lostLeads = dashboardLeads.filter(
  (lead) => lead.status === "lost"
).length;

const pendingReminders =
  dashboardReminders.filter(
    (reminder) => reminder.status === "pending"
  ).length;

const overdueReminders =
  dashboardReminders.filter(
    (reminder) =>
      reminder.status === "pending" &&
      reminder.dueAt &&
      new Date(reminder.dueAt) < new Date()
  ).length;

const stageCounts = stages.map((stage) => ({
  ...stage,
  count: dashboardLeads.filter((lead) => {
    const leadStageId =
      lead.currentStage?._id ||
      lead.currentStage;

    return (
      String(leadStageId) ===
      String(stage._id)
    );
  }).length,
}));
  // Dashboard
  if (showUserManagement) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-mark small">
            D
          </div>

          <span>D-Table CRM</span>
        </div>

        <div className="topbar-right">
  <div className="notification-wrapper">
    <button
      className="notification-button"
      onClick={() =>
        setShowNotifications((previous) => !previous)
      }
      title="Notifications"
    >
      🔔

      {unreadCount > 0 && (
        <span className="notification-badge">
          {unreadCount > 99
            ? "99+"
            : unreadCount}
        </span>
      )}
    </button>

    {showNotifications && (
      <div className="notification-dropdown">
        <div className="notification-header">
          <div>
            <strong>Notifications</strong>

            <span>
              {unreadCount} unread
            </span>
          </div>

          {unreadCount > 0 && (
            <button
              className="mark-all-button"
              onClick={markAllAsRead}
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="notification-list">
          {notifications.length === 0 ? (
            <div className="notification-empty">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <button
                key={notification._id}
                className={`notification-item ${
                  notification.isRead
                    ? "read"
                    : "unread"
                }`}
                onClick={() => {
                  if (!notification.isRead) {
                    markAsRead(notification._id);
                  }
                }}
              >
                <div className="notification-icon">
                  {notification.type === "reminder"
                    ? "⏰"
                    : "🔔"}
                </div>

                <div className="notification-content">
                  <strong>
                    {notification.title}
                  </strong>

                  <p>
                    {notification.message}
                  </p>

                  <small>
                    {new Date(
                      notification.createdAt
                    ).toLocaleString()}
                  </small>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    )}
  </div>

  <span className="admin-badge">
    Admin
  </span>

  <div className="user-info">
    <strong>Pratik</strong>
    <span>admin@crm.com</span>
  </div>

  <button
    className="logout-button"
    onClick={handleLogout}
  >
    Logout
  </button>
</div>
      </header>

      <UserManagement
        onClose={() =>
          setShowUserManagement(false)
        }
      />
    </div>
  );
}
  if (showLeadManagement && selectedCRM) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-mark small">
            D
          </div>

          <span>D-Table CRM</span>
        </div>

        <div className="topbar-right">
          <span className="admin-badge">
            Admin
          </span>

          <div className="user-info">
            <strong>Pratik</strong>
            <span>admin@crm.com</span>
          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <LeadManagement
  crm={selectedCRM}
  stages={stages}
  connections={connections}
  onClose={() =>
    setShowLeadManagement(false)
  }
/>
    </div>
  );
}
  if (
  showFormBuilder &&
  selectedCRM &&
  selectedStageForForm
) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-mark small">
            D
          </div>

          <span>D-Table CRM</span>
        </div>

        <div className="topbar-right">
          <span className="admin-badge">
            Admin
          </span>

          <div className="user-info">
            <strong>Pratik</strong>
            <span>admin@crm.com</span>
          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <FormBuilder
        crm={selectedCRM}
        stage={selectedStageForForm}
        onClose={() => {
          setShowFormBuilder(false);
          setSelectedStageForForm(null);
        }}
      />
    </div>
  );
}
  if (showWorkflowBuilder && selectedCRM) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-mark small">
            D
          </div>

          <span>D-Table CRM</span>
        </div>

        <div className="topbar-right">
          <span className="admin-badge">
            Admin
          </span>

          <div className="user-info">
            <strong>Pratik</strong>
            <span>admin@crm.com</span>
          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <WorkflowBuilder
        crm={selectedCRM}
        stages={stages}
        connections={connections}
        setConnections={setConnections}
        onClose={() =>
          setShowWorkflowBuilder(false)
        }
      />
    </div>
  );
}
  if (showStageBuilder && selectedCRM) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-mark small">
            D
          </div>

          <span>D-Table CRM</span>
        </div>

        <div className="topbar-right">
          <span className="admin-badge">
            Admin
          </span>

          <div className="user-info">
            <strong>Pratik</strong>
            <span>admin@crm.com</span>
          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <StageBuilder
  crm={selectedCRM}
  stages={stages}
  setStages={setStages}
  onClose={() =>
    setShowStageBuilder(false)
  }
  onOpenFormBuilder={(stage) => {
    setSelectedStageForForm(stage);
    setShowStageBuilder(false);
    setShowFormBuilder(true);
  }}
/>
    </div>
  );
}
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-mark small">D</div>
          <span>D-Table CRM</span>
        </div>

        <div className="topbar-right">
          <span className="admin-badge">Admin</span>

          <div className="user-info">
            <strong>Pratik</strong>
            <span>admin@crm.com</span>
          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-layout">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-section">
            <span className="sidebar-label">
              WORKSPACE
            </span>

            <button className="nav-item active">
              <span>▦</span>
              Dashboard
            </button>

            <button className="nav-item">
              <span>◇</span>
              CRMs
            </button>

            <button
  className="nav-item"
  onClick={() => {
    if (!selectedCRM) {
      setError("Please select a CRM first");
      return;
    }

    setShowLeadManagement(true);
  }}
>
  <span>◉</span>
  Leads
</button>
          </div>

          <div className="sidebar-section">
            <span className="sidebar-label">
              CONFIGURATION
            </span>

            <button
  className="nav-item"
  onClick={() => {
    if (!selectedCRM) {
      setError("Please select a CRM first");
      return;
    }

    setShowStageBuilder(true);
  }}
>
  <span>▱</span>
  Stage Builder
</button>

<button
  className="nav-item"
  onClick={() => {
    if (!selectedCRM) {
      setError("Please select a CRM first");
      return;
    }

    setShowWorkflowBuilder(true);
  }}
>
  <span>⚙</span>
  Workflow Builder
</button>

<button
  className="nav-item"
  onClick={() => setShowUserManagement(true)}
>
  <span>👥</span>
  Users & Teams
</button>

<button className="nav-item">
  <span>□</span>
  Form Builder
</button>

            <button
  className="nav-item"
  onClick={() => {
    if (!selectedCRM) {
      setError(
        "Please create or select a CRM first."
      );
      return;
    }

    setShowAutomationBuilder(true);
  }}
>
  <span>⚙️</span>
  Automations
</button>
          </div>

          <div className="sidebar-section">
            <span className="sidebar-label">
              REPORTING
            </span>

            <button className="nav-item">
              <span>▥</span>
              Reports
            </button>

            <button className="nav-item">
              <span>↗</span>
              Exports
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="main-content">
          <div className="page-header">
            <div>
              <span className="eyebrow">
                WORKSPACE
              </span>

              <h1>CRM Dashboard</h1>

              <p>
                Configure workflows, manage leads, and
                track your business pipeline.
              </p>
            </div>

            <button
              className="primary-button create-button"
              onClick={() => {
                
                setError("");
                setShowCreateCRM(true);
              }}
            >
              + Create CRM
            </button>
          </div>

          {/* ERROR */}
          {error && (
            <div className="error-message builder-error">
              {error}
            </div>
          )}

          {/* STATS */}
          <section className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">
                Total CRMs
              </span>

              <strong>{crms.length}</strong>

              <span className="stat-description">
                Active CRM configurations
              </span>
            </div>

            <div className="stat-card">
              <span className="stat-label">
                Total Stages
              </span>

              <strong>{stages.length}</strong>

              <span className="stat-description">
                In selected CRM
              </span>
            </div>

            <div className="stat-card">
              <span className="stat-label">
                Workflow Connections
              </span>

              <strong>{connections.length}</strong>

              <span className="stat-description">
                Configured transitions
              </span>
            </div>

            <div className="stat-card">
              <span className="stat-label">
                Selected CRM
              </span>

              <strong>
                {selectedCRM
                  ? selectedCRM.name
                  : "None"}
              </strong>

              <span className="stat-description">
                Currently selected
              </span>
            </div>
          </section>

          <section className="stats-grid">
  <div className="stat-card">
    <span className="stat-label">
      Total Leads
    </span>

    <strong>{totalLeads}</strong>

    <span className="stat-description">
      Leads in selected CRM
    </span>
  </div>

  <div className="stat-card">
    <span className="stat-label">
      Active Leads
    </span>

    <strong>{activeLeads}</strong>

    <span className="stat-description">
      Currently active
    </span>
  </div>

  <div className="stat-card">
    <span className="stat-label">
      Won Leads
    </span>

    <strong>{wonLeads}</strong>

    <span className="stat-description">
      Successfully converted
    </span>
  </div>

  <div className="stat-card">
    <span className="stat-label">
      Lost Leads
    </span>

    <strong>{lostLeads}</strong>

    <span className="stat-description">
      Closed as lost
    </span>
  </div>
</section>

<section className="content-card">
  <div className="section-header">
    <div>
      <h2>Leads by Stage</h2>

      <p>
        Current lead distribution across the
        selected CRM workflow.
      </p>
    </div>
  </div>

  {stageCounts.length === 0 ? (
    <div className="empty-state">
      No stages configured.
    </div>
  ) : (
    <div className="stage-analytics">
      {stageCounts.map((stage) => {
        const percentage =
          totalLeads > 0
            ? Math.round(
                (stage.count / totalLeads) * 100
              )
            : 0;

        return (
          <div
            className="stage-analytics-row"
            key={stage._id}
          >
            <div className="stage-analytics-header">
              <span>
                {stage.name}
              </span>

              <strong>
                {stage.count}
              </strong>
            </div>

            <div className="stage-analytics-bar">
              <div
                className="stage-analytics-fill"
                style={{
                  width: `${percentage}%`,
                }}
              />
            </div>

            <small>
              {percentage}% of leads
            </small>
          </div>
        );
      })}
    </div>
  )}
</section>

<section className="content-card">
  <div className="section-header">
    <div>
      <h2>Reminders</h2>

      <p>
        Follow-up reminders for the selected CRM.
      </p>
    </div>
  </div>

  <div className="reminder-summary">
    <div className="reminder-summary-card">
      <span className="stat-label">
        Pending
      </span>

      <strong>
        {pendingReminders}
      </strong>

      <span className="stat-description">
        Active reminders
      </span>
    </div>

    <div className="reminder-summary-card">
      <span className="stat-label">
        Overdue
      </span>

      <strong>
        {overdueReminders}
      </strong>

      <span className="stat-description">
        Require attention
      </span>
    </div>
  </div>
</section>

<div className="content-card export-card">
  <div className="section-header">
    <div>
      <h3>Export Data</h3>
      <p>Download lead data for the selected CRM.</p>
    </div>
  </div>

  <div className="export-actions">
    <button
      className="primary-button"
      onClick={handleExportCSV}
      disabled={!dashboardLeads.length}
    >
      ↓ Export CSV
    </button>

    <button
      className="secondary-button"
      onClick={handleExportExcel}
      disabled={!dashboardLeads.length}
    >
      ↓ Export Excel
    </button>
  </div>

  <small className="export-info">
    {dashboardLeads.length} lead
    {dashboardLeads.length !== 1 ? "s" : ""} available for export
  </small>
</div>

          {/* CRM LIST */}
          <section className="content-card">
            <div className="section-header">
              <div>
                <h2>Your CRMs</h2>

                <p>
                  Manage your configurable CRM systems.
                </p>
              </div>

              <button className="secondary-button">
                View all
              </button>
            </div>

            {dashboardLoading ? (
              <div className="empty-state">
                Loading CRMs...
              </div>
            ) : crms.length === 0 ? (
              <div className="empty-state">
                No CRMs found.
              </div>
            ) : (
              crms.map((crm) => (
                <div
                  className={`crm-card ${
                    selectedCRM?._id === crm._id
                      ? "selected-crm"
                      : ""
                  }`}
                  key={crm._id}
                >
                  <div className="crm-icon">
                    {crm.name
                      .split(" ")
                      .map((word) => word[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>

                  <div className="crm-details">
                    <h3>{crm.name}</h3>

                    <p>
                      {crm.description ||
                        "No description provided"}
                    </p>

                    <div className="crm-meta">
                      <span>
                        {selectedCRM?._id === crm._id
                          ? stages.length
                          : "—"}{" "}
                        stages
                      </span>

                      <span>•</span>

                      <span>
                        {selectedCRM?._id === crm._id
                          ? connections.length
                          : "—"}{" "}
                        workflow connections
                      </span>
                    </div>
                  </div>

                  <button
                    className="outline-button"
                    onClick={async () => {
  try {
    setDashboardLoading(true);
    setError("");

    const [
      stageResponse,
      workflowResponse,
      leadResponse,
      reminderResponse,
    ] = await Promise.all([
      apiRequest(`/stages/crm/${crm._id}`),
      apiRequest(`/workflows/crm/${crm._id}`),
      apiRequest(`/leads/crm/${crm._id}`),
      apiRequest(`/reminders?crmId=${crm._id}`),
    ]);

    setSelectedCRM(crm);
    setStages(stageResponse.stages || []);
    setConnections(workflowResponse.connections || []);
    setDashboardLeads(leadResponse.leads || []);
    setDashboardReminders(reminderResponse.reminders || []);
  } catch (err) {
    setError(err.message);
  } finally {
    setDashboardLoading(false);
  }
}}
                  >
                    Open CRM →
                  </button>
                </div>
              ))
            )}
          </section>

          {/* WORKFLOW */}
          <section className="content-card">
            <div className="section-header">
              <div>
                <h2>Current Workflow</h2>

                <p>
                  {selectedCRM
                    ? selectedCRM.name
                    : "No CRM selected"}
                </p>
              </div>

              <button
  className="secondary-button"
  onClick={() => {
    if (!selectedCRM) {
      setError("Please select a CRM first");
      return;
    }

    setShowWorkflowBuilder(true);
  }}
>
  Edit Workflow
</button>
            </div>

            <div className="workflow-preview">
              {stages.length === 0 ? (
                <div className="empty-state">
                  No workflow stages configured.
                </div>
              ) : (
                stages.map((stage, index) => (
                  <div
                    className="workflow-stage-wrapper"
                    key={stage._id}
                  >
                    <WorkflowStage
                      name={stage.name}
                      initial={stage.isInitial}
                      final={stage.isFinal}
                    />

                    {index < stages.length - 1 && (
                      <div className="workflow-arrow">
                        →
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {connections.length > 0 && (
              <div className="connections-list">
                <div className="connection-title">
                  Configured transitions
                </div>

                {connections.map(
                  (connection) => (
                    <div
                      className="connection-item"
                      key={connection._id}
                    >
                      <span>
                        {connection.fromStage?.name}
                      </span>

                      <span className="connection-arrow">
                        →
                      </span>

                      <span>
                        {connection.toStage?.name}
                      </span>

                      {connection.label && (
                        <span className="connection-label">
                          {connection.label}
                        </span>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        </main>
      </div>

            {/* AUTOMATION BUILDER */}
      {showAutomationBuilder &&
        selectedCRM && (
          <AutomationBuilder
            crm={selectedCRM}
            stages={stages}
            onClose={() =>
              setShowAutomationBuilder(false)
            }
          />
        )}

      {/* CREATE CRM MODAL */}
      
      {showCreateCRM && (
        <div
          className="modal-overlay"
          onClick={() =>
            setShowCreateCRM(false)
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
                <h2>Create CRM</h2>

                <p>
                  Create a new configurable CRM
                  workflow.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setShowCreateCRM(false)
                }
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateCRM}>
              <label>CRM Name</label>

              <input
                type="text"
                value={crmName}
                onChange={(e) =>
                  setCrmName(e.target.value)
                }
                placeholder="e.g. Interior Design CRM"
                required
              />

              <label>Description</label>

              <textarea
                value={crmDescription}
                onChange={(e) =>
                  setCrmDescription(
                    e.target.value
                  )
                }
                placeholder="Describe what this CRM is used for"
                rows="4"
              />

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowCreateCRM(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={creatingCRM}
                >
                  {creatingCRM
                    ? "Creating..."
                    : "Create CRM"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function WorkflowStage({
  name,
  initial,
  final,
}) {
  return (
    <div
      className={`workflow-stage ${
        initial ? "initial" : ""
      } ${final ? "final" : ""}`}
    >
      <span className="stage-dot"></span>

      <span>{name}</span>
    </div>
  );
}

export default App;