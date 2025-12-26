# SkillMatch Agency

A full-stack web application for managing personnel skills, projects, and finding the perfect match for project requirements. Now featuring advanced resource scheduling and a modern, responsive UI.

## 🚀 Features

### Core Management
- **Personnel Management**: Add, edit, delete personnel with skills and proficiency levels.
- **Skill Catalog**: Manage a database of technical and soft skills.
- **Projects**: Create projects with specific start/end dates and status.

### 📅 Resource Scheduling (New!)
- **Gantt Chart Scheduler**: Visual timeline to assign personnel to projects.
- **Drag-and-Drop**: Easy visualization of who is working on what and when.
- **Conflict Prevention**: (Roadmap) Future support for overlapping detection.

### 🎨 Enhanced UI/UX (New!)
- **Modal-Based Editing**: Clean, form-based editing for all entities.
- **Toast Notifications**: Non-intrusive, real-time feedback for all actions using `SweetAlert2`.
- **Delete Confirmations**: Custom styled alerts to prevent accidental deletions.
- **Responsive Design**: Works on varying screen sizes using Tailwind CSS.

### Intelligent Matching
- **Matchmaking Algorithm**: Automatically suggests personnel who meet 100% of a project's skill requirements.
- **Proficiency Filtering**: Ensures candidates meet or exceed the required proficiency (e.g., Senior > Junior).

### 📊 Strategic Analytics
- **Dashboard**: Real-time insights into resource counters.
- **Visualizations**: Bar charts for top skills and experience tracking.

## 🛠 Technology Stack

- **Frontend**: React.js 18, Vite, Tailwind CSS
- **Libraries**: `gantt-task-react`, `sweetalert2`, `recharts`, `lucide-react`, `axios`
- **Backend**: Node.js, Express.js
- **Database**: MySQL (using `mysql2` pool)
- **Tooling**: pnpm

## 📋 Prerequisites

- **Node.js**: v18 or higher
- **MySQL**: v8.0 or higher
- **pnpm**: `npm install -g pnpm`

## ⚙️ How to Run

### 1. Clone the Repository
```bash
git clone <repository-url>
cd SkillMatchAgency
```

### 2. Database Setup
1.  Ensure MySQL is running on `localhost:3306`.
2.  Create the database and tables:
    ```bash
    cd server
    pnpm install
    
    # Initialize Core Schema
    node scripts/initDb.js
    
    # Initialize Assignments Table (New Feature)
    node scripts/createAssignmentsTable.js
    ```
3.  **Environment Variables**: Update `server/.env` if your MySQL user/password differs from `root`/`` (empty).

### 3. Start Backend Server
```bash
# In /server directory
pnpm start
# Server runs on http://localhost:5000
```

### 4. Start Frontend Client
```bash
# Open a new terminal
cd client
pnpm install
pnpm dev
# Client runs on http://localhost:5173
```

## 🧪 API Endpoints

### Personnel & Skills
- `GET /api/personnel`: List all personnel
- `POST /api/personnel`: Create new personnel
- `GET /api/skills`: List all skills

### Projects & Assignments
- `GET /api/projects`: List all projects
- `GET /api/assignments`: **(New)** Get all resource assignments for the Gantt chart
- `POST /api/assignments`: **(New)** Create a new assignment

### Matching & Analytics
- `GET /api/match/:projectId`: Find matches for a project
- `GET /api/analytics`: Get dashboard statistics

## 🧩 Matching Algorithm Logic
The matching algorithm (`server/controllers/matchingController.js`) is explicit and rules-based:
1.  **Requirement Check**: Iterates through every candidate.
2.  **Hard Constraint**: Candidate must possess *every single skill* listed in the project requirements.
3.  **Proficiency Threshold**: For each required skill, the candidate's level (Beginner=1 -> Expert=4) must be greater than or equal to the project's minimum requirement.
