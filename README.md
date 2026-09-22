# D-Table CRM & ERP

A configurable CRM/ERP application built as a MERN-stack project. The system allows administrators to create custom CRM workflows, configure stages and forms, manage leads, automate actions, schedule reminders, track activities, and analyze CRM performance.

The application is designed around a dynamic configuration model rather than hardcoded CRM stages or forms.

---

## Live Demo

### Frontend
https://crm-erp-1.onrender.com/

### Backend API
https://crm-erp-k0nm.onrender.com

> The frontend URL will be updated after the final Netlify deployment.

---

## GitHub Repository

https://github.com/Pratikjoshi108/crm-erp

---

## Features

### 1. Dynamic CRM Builder

- Create multiple CRM configurations
- Define CRM name and description
- Activate/deactivate CRM configurations
- Select and manage different CRM workflows

### 2. Dynamic Stage Builder

- Create stages dynamically
- Configure stage names and descriptions
- Set stage order
- Configure initial stages
- Configure final stages
- Reorder stages
- Stage-specific configuration

Stages are stored in the database and are not hardcoded in the frontend.

### 3. Workflow Builder

- Create connections between stages
- Define allowed stage transitions
- Configure transition labels
- Support branching workflows
- Prevent invalid/self stage connections
- Enforce configured transitions when moving leads

Example:

New Inquiry
→ Design Consultation
→ Proposal Sent
→ Client Approval
→ Project Execution
→ Project Completed

A branch can also be configured:

Design Consultation
→ Not Proceeding

### 4. Dynamic Form Builder

Forms are configured independently for each CRM stage.

Supported field types include:

- Text
- Number
- Email
- Phone
- Date/time
- Dropdown
- Multiselect
- Checkbox
- Radio
- File
- Image
- Location
- User selection

Additional configuration includes:

- Required/optional fields
- Default values
- Placeholder text
- Options
- Validation
- Field ordering

Forms are generated dynamically from database configuration.

### 5. Lead Management

- Create leads
- View lead details
- Track current stage
- Store dynamic form data
- Assign users
- Assign teams
- Move leads between configured stages
- Enforce workflow transitions
- Track lead status
- View stage history
- Add reminders
- Complete reminders
- Track timestamps

Lead statuses:

- Active
- Won
- Lost

### 6. Stage History

Lead stage changes are recorded with:

- Previous stage
- New stage
- User who performed the change
- Timestamp
- Automation execution information

This provides an audit trail of lead movement through the CRM.

### 7. Reminders

Users can create lead-specific reminders containing:

- Title
- Description
- Due date/time
- Status

Reminder states include:

- Pending
- Completed
- Cancelled

The dashboard also displays:

- Pending reminders
- Overdue reminders

### 8. Automation

The automation engine supports triggers such as:

- Lead created
- Stage entered
- Stage exited
- Scheduled execution

Supported actions include:

- Create reminder
- Send notification
- Move lead to another stage

Scheduled automation is processed through a backend scheduler.

### 9. Real-Time Notifications

The application uses Socket.IO for real-time notifications.

Notifications can be generated for events such as:

- Assignments
- Stage changes
- Reminders
- Automations
- System events

Users can:

- View unread notifications
- Mark individual notifications as read
- Mark notifications as read

### 10. Dashboard & Analytics

The dashboard provides CRM-level analytics including:

- Total CRMs
- Total stages
- Workflow connections
- Total leads
- Active leads
- Won leads
- Lost leads
- Leads by stage
- Pending reminders
- Overdue reminders

Lead distribution is visualized by CRM stage.

### 11. CSV & Excel Export

Lead data can be exported from the dashboard.

Supported formats:

- CSV
- Excel (`.xlsx`)

Exported data includes CRM/lead information and dynamically stored lead form data.

### 12. Authentication

The application uses JWT-based authentication.

Authentication includes:

- Login
- Protected API routes
- JWT authorization
- Role-based access structure

---

# Technology Stack

## Frontend

- React
- Vite
- JavaScript
- CSS
- Socket.IO Client
- XLSX

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- Socket.IO
- Node Scheduler/Cron-based processing

## Database

- MongoDB Atlas

## Deployment

- Frontend: Netlify
- Backend: Render
- Database: MongoDB Atlas

---

# Architecture

```text
                    ┌─────────────────────┐
                    │      React UI       │
                    │      Vite           │
                    └──────────┬──────────┘
                               │
                         REST API / Socket.IO
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Node / Express    │
                    │      Backend        │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
        Authentication     CRM Logic       Automation
        & Authorization    & Leads         Scheduler
              │                │                │
              └────────────────┼────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    MongoDB Atlas    │
                    └─────────────────────┘
