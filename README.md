# CampusGuard - Student Entry/Exit & Security System

## 📋 Prerequisites
- **Node.js** (v14 or higher) installed on your system.
- A terminal (Command Prompt or PowerShell).

## 🚀 Setup & Installation (First Time Only)
1.  Open your terminal.
2.  Navigate to the project folder:
    ```bash
    cd C:\Projects\DAAProject
    ```
    *(Or wherever you have saved the project)*
3.  Install the required dependencies:
    ```bash
    npm install
    ```

## ▶️ Running the Application
1.  Start the server:
    ```bash
    node server.js
    ```
2.  You should see the message: `Server V3 running on http://localhost:3000`

## 🌐 Accessing the App
Open your web browser (Chrome/Edge) and go to:
**http://localhost:3000**

## 🔑 Login Credentials (Defaults)
| Role | Username (ID) | Password |
| :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` |
| **Teacher** | `teacher` | `teach123` |
| **Guard** | `guard` | `secure123` |
| **Student** | `S101` | `password` |

## 🛠️ Features Quick Guide
*   **Admin**: Register users, Manage Schedules, Post Notices, Delete Class/User.
*   **Guard**: Scan QR for Entry/Exit, Manage Visitors (`/pages/visitor.html`).
*   **Teacher**: Check Schedule, Start Class, Scan Student QR for Attendance.
*   **Student**: View Dashboard, Check Attendance %, Apply for Leave, Helpdesk.
