# Campus Guard 🚨🎓

Campus Guard is a smart student entry-exit logging and attendance tracking system designed for college campuses. It combines security, automation, and scheduling to streamline student movement and ensure a safer, smarter campus.

## 🛠️ Features

- ✅ **QR Code-Based Student Registration**
- 🔐 **Student Entry/Exit Logs**  
  - Entry: Uses **Hashing**
  - Exit: Uses **Linear Search**
- 📅 **Class Schedule Management**  
  - Implemented using **Interval Scheduling (Greedy Algorithm)**
- 📲 **Automated Attendance System**
  - Attendance marked automatically via QR scan if within scheduled time
- 📷 **QR Code Scanner** for real-time logging

## 🧑‍💻 Tech Stack

- **Frontend:** HTML, CSS, JavaScript  
- **Backend:** PHP  
- **Database:** MySQL  
- **Tools:** XAMPP, QRCode.js

## 📂 Project Structure
campus-guard/ ├── frontend/ │ ├── index.html │ ├── entry.html │ ├── exit.html │ ├── attendance.html │ └── styles/ │ └── main.css ├── backend/ │ ├── connect_entry.php │ ├── connect_exit.php │ ├── mark_attendance.php │ └── fetch_schedule.php ├── assets/ │ └── qr/ ├── database/ │ └── entrylog.sql └── README.md



## 🏗️ Database Tables

- `registration` – Stores student details
- `qrdata` – Handles data used for QR generation
- `entrylog` – Logs of student entries
- `exitlog` – Logs of student exits
- `attendance` – Marked attendance data
- `schedule` – Class schedule data for auto-attendance

## ⚙️ How to Run

1. Clone the repository:
   ```bash
   git clone https://github.com/Abhijith-Reddy-ch/CampusGuard.git

2. Import the SQL dump into your MySQL database.

3. Start XAMPP and run Apache & MySQL.

4. Place the project folder inside htdocs/.

5. Open the browser and go to http://localhost/campus-guard/frontend/index.html.


## 🚧 Future Enhancements
Add role-based authentication for Admin/Students

Enable live notifications for unauthorized movement

Support for mobile app integration

Real-time analytics dashboard

## 📄 License

This project is licensed under the [MIT License](./LICENSE) © 2025 [Abhijith-Reddy-ch].

---

Made with ❤️ by [Abhijith-Reddy-ch]

