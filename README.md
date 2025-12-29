# CampusGuard - Advanced Student Attendance & Security System 🛡️

![CampusGuard Banner](https://img.shields.io/badge/Status-Production%20Ready-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue) ![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-green)

A comprehensive, full-stack web application designed to digitize campus security, automate attendance via QR codes, and provide real-time analytics for students, teachers, and security staff.

## ✨ Key Features

### 🔐 Security & Access Control
*   **Role-Based Access Control (RBAC)**: Distinct dashboards for Admins, Teachers, Guards, and Students.
*   **QR Code Entry/Exit**: Real-time logging of student movements at campus gates.
*   **Visitor Management System**: Digital tracking of guests, check-in/check-out times, and purpose of visit.
*   **SOS Emergency Alert**: One-click distress signal for students with geolocation support.

### 📚 Academic Management
*   **Smart Attendance**: Teachers start class sessions; students scan a session-specific QR code to mark attendance.
*   **Schedule Management**: Conflict-free scheduling engine for classes.
*   **Analytics**: Visual charts for attendance trends, daily stats, and student history.

### 👤 User Dashboards
*   **Admin**: Full control over users, schedules, notices, and system logs. Includes "Deep Delete" protocols for data management.
*   **Student**: View personal attendance %, access notices, and raise helpdesk tickets.
*   **Teacher**: Manage classes, view historical logs, and monitor class strength in real-time.

---

## 🛠️ Technology Stack

*   **Frontend**: HTML5, CSS3 (Custom Variables/Dark Mode), Vanilla JavaScript.
*   **Backend**: Node.js, Express.js.
*   **Database**: JSON-based local storage (Simulating NoSQL structure) with transactional integrity.
*   **Security**: `bcryptjs` for password hashing, session validation.
*   **Libraries**: `html5-qrcode` (Scanning), `Leaflet.js` (Maps), `Chart.js` (Analytics).

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v14+) installed.
*   Git installed.

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/Abhijith-Reddy-ch/CampusGuard.git
    cd CampusGuard
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Start the Server**
    ```bash
    npm start
    ```
    *Server runs on port 3000 by default.*

4.  **Access the App**
    Open `http://localhost:3000` in your browser.

---

## 🔑 Default Credentials (for Testing)

The system comes pre-seeded with an Admin account. All other data is clean.

| Role | Username | Password |
| :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` |

*(Note: Create new Student/Teacher/Guard accounts using the Admin Dashboard)*

---

## 📸 Usage Guide

1.  **Login as Admin** to set up the campus (Add Teachers, Guards, Schedules).
2.  **Login as Student** to view your Generated QR Code.
3.  **Login as Guard** to verify Student QR codes at the gate.
4.  **Login as Teacher** to display a Class QR code for attendance.

---

## 🛡️ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Built with ❤️ by Abhijith Reddy*
