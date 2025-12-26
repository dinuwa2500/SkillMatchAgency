# SkillMatch Agency

A full-stack web application for managing personnel skills, projects, and finding the perfect match for project requirements.

## 🚀 Features

### Core Management
- **Personnel Management**: Add, edit, delete personnel with skills and proficiency levels.
- **Skill Catalog**: Manage a database of technical and soft skills.
- **Project Management**: Create projects with specific start/end dates and status.

### Intelligent Matching
- **Matchmaking Algorithm**: Automatically suggests personnel who meet 100% of a project's skill requirements.
- **Proficiency Filtering**: Ensures candidates meet or exceed the required proficiency (e.g., Senior > Junior).

### 🌟 Additional Feature: Strategic Skill Analytics Dashboard
A real-time dashboard providing insights into the consultancy's resources:
- **Resource Counters**: Instant view of total personnel, skills, and projects.
- **Top Skills Visualization**: Bar chart showing the most common skills among personnel.
- **Experience Distribution**: Visual breakdown of Junior vs. Mid-Level vs. Senior staff.

## 🛠 Technology Stack

- **Frontend**: React.js, Vite, Tailwind CSS, Lucide React (Icons)
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Tooling**: pnpm, Postman (for testing)

## 📋 Prerequisites

- **Node.js**: v18 or higher
- **MySQL**: v8.0 or higher
- **pnpm**: `npm install -g pnpm`

## ⚙️ How to Run

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd SkillMatchAgency
   ```

2. **Database Setup**
   - Ensure MySQL is running on `localhost:3306`.
   - Create a database named `skillmatch_agency` or let the init script do it.
   - Update `server/.env` if your MySQL user/password differs from `root`/`` (empty).

   ```bash
   # Initialize Database Schema
   cd server
   pnpm install
   node scripts/initDb.js
   ```

3. **Start Backend Server**
   ```bash
   # In /server directory
   pnpm start
   # Server runs on http://localhost:5000
   ```

   ```

## 🛠 Using MySQL Workbench (Alternative Setup)

If you prefer using **MySQL Workbench** to manage your database:

1.  **Open MySQL Workbench** and connect to your local instance (usually `Local instance MySQL80`).
2.  **Open the Schema Script**:
    - Go to `File` -> `Open SQL Script...`
    - Select `server/db/schema.sql` from this project.
3.  **Run the Script**:
    - Click the ⚡ (Lightning bolt) icon to execute the script.
    - This will create the `skillmatch_agency` database and all tables.
4.  **Verify Connection Details**:
    - Check your MySQL Workbench connection settings (Port, Username usually `root`).
    - Update `server/.env` if you have a password set in Workbench:
      ```env
      DB_USER=root
      DB_PASSWORD=your_workbench_password
      ```

## ⚙️ Architecture Explained
React (Frontend) **does not** connect to MySQL directly.
1.  **React** sends HTTP requests (e.g., "Get all personnel") to the **Node.js Server**.
2.  **Node.js Server** connects to **MySQL** to fetch the data.
3.  **Node.js Server** sends the data back to **React**.

4. **Start Frontend Client**
   ```bash
   # Open a new terminal
   cd client
   pnpm install
   pnpm dev
   # Client runs on http://localhost:5173
   ```

## 🧪 API Endpoints

- `GET /api/personnel`: List all personnel
- `POST /api/personnel`: Create new personnel
- `POST /api/personnel/:id/skills`: Assign skill to personnel
- `GET /api/skills`: List all skills
- `GET /api/projects`: List all projects
- `GET /api/match/:projectId`: Find matches for a project
- `GET /api/analytics`: Get dashboard statistics

## 🎨 Creative Feature
The **Strategic Skill Analytics Dashboard** solves the problem of "Resource Visibility". Consultancy managers often struggle to know their team's aggregate capabilities at a glance. This dashboard answers questions like "Do we have enough Seniors?" or "What is our most abundant skill?" instantly.

## 🧩 Matching Algorithm Logic
The matching algorithm (`server/controllers/matchingController.js`) is explicit and rules-based:
1.  **Requirement Check**: Iterates through every candidate.
2.  **Hard Constraint**: Candidate must possess *every single skill* listed in the project requirements.
3.  **Proficiency Threshold**: For each required skill, the candidate's level (Beginner=1 -> Expert=4) must be greater than or equal to the project's minimum requirement.
