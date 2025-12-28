# SkillMatch Agency

A full-stack web application for managing personnel skills, projects, and finding the perfect match for project requirements. Now featuring **Advanced Resource Scheduling** and a **Mobile-First Responsive UI**.

## 🐳 Quick Start (Docker)

The easiest way to run the application is using Docker.

```bash
# 1. Start everything
docker-compose up --build -d

# 2. Open in Browser
# Frontend: http://localhost
# Backend:  http://localhost:5000
```
*   **Credentials**: Database password matches the container auto-config.
*   **Stop**: Run `docker-compose down`.

---

## 🤖 Continuous Integration (CI/CD)

This project uses **GitHub Actions** to automate quality checks.

*   **Workflow**: `.github/workflows/ci.yml`
*   **Action**: Automatically runs `docker-compose build` on every push to `main` or Pull Request.
*   **Benefit**: Ensures that every code change is compile-safe and Docker-ready before merging.
*   **Status**: [![CI - Build and Test](https://github.com/dinuwa2500/SkillMatchAgency/actions/workflows/ci.yml/badge.svg)](https://github.com/dinuwa2500/SkillMatchAgency/actions/workflows/ci.yml)

---

## 🚀 Key Features

### 📱 Mobile-First Experience **(New!)**
- **Seamless Responsiveness**: Optimized for Phones, Tablets, and Desktops.
- **Adaptive Layouts**:
    - **Dashboard**: Auto-switching from 2-column stats (Mobile) to 4-column (Desktop).
    - **Tables**: Smartly convert to **Card Views** or **Compact Lists** on small screens.
    - **Navigation**: Touch-friendly Hamburger menu for mobile navigation.

### 📅 Resource Scheduling
- **Gantt Chart**: Visual timeline to assign personnel to projects.
- **Smart Assignment**: Drag-and-drop support with real-time updates.

### Core Management
- **Personnel**: Manage staff with skills and seniority levels.
- **Projects**: Track project timelines and status.
- **Skills**: Maintain a catalog of technical and soft skills.

### 🎨 Premium UI/UX
- **Modern Design**: Clean interface with "Inter" typography and Tailwind styling.
- **Smart Notifications**: Non-intrusive Toasts for all actions.
- **Safe Deletes**: SweetAlert2 confirmations to prevent accidents.

### 🧩 Intelligent Matching
- **Algorithm**: `server/controllers/matchingController.js`
- **Logic**: Suggests candidates who matching **100% of skills** at the **required proficiency**.

## 🛠 Technology Stack

- **Infrastructure**: Docker, Docker Compose, Nginx
- **Frontend**: React 19, Vite, Tailwind CSS 4
- **Backend**: Node.js, Express.js
- **Database**: MySQL 8.0
- **Libraries**: `gantt-task-react`, `sweetalert2`, `recharts`, `lucide-react`

## ⚙️ Manual Setup (Dev Mode)

If you prefer running without Docker:

### 1. Database
Ensure MySQL is running on `localhost:3306` and credentials match `server/.env`.
```bash
cd server
pnpm install
node scripts/initDb.js
node scripts/createAssignmentsTable.js
```

### 2. Backend
```bash
cd server
pnpm start
# Runs on http://localhost:5000
```

### 3. Frontend
```bash
cd client
pnpm install
pnpm dev
# Runs on http://localhost:5173
```
