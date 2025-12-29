const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const uuid = require('uuid');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = require('./services/db');
const logic = require('./services/logic');

// --- Auth ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.getUser(username, password);
    if (user) {
        let dept = null;
        if (user.role === 'student') {
            const s = db.getStudent(user.id);
            if (s) dept = s.department;
        }
        res.json({ success: true, user: { id: user.id, role: user.role, name: user.name, department: dept } });
    } else {
        res.status(401).json({ error: "Invalid Credentials" });
    }
});

app.post('/api/register', (req, res) => {
    const { id, name, age, department } = req.body;
    if (db.getStudent(id)) return res.status(400).json({ error: "Exists" });
    db.addStudent({ id, name, age, department, regTime: new Date() });
    db.createUser({ id, password: 'password', role: 'student', name });
    res.json({ success: true, message: "Registered" });
});

app.post('/api/register-staff', (req, res) => {
    const { id, name, role, password, subjects } = req.body; // V4: subjects
    if (!id || !name || !role || !password) return res.status(400).json({ error: "Missing fields" });
    if (role !== 'teacher' && role !== 'guard' && role !== 'admin') return res.status(400).json({ error: "Invalid role" });

    const exists = require('./services/db').users.find(u => u.id === id);
    if (exists) return res.status(400).json({ error: "User ID already exists" });

    // V4: Split subjects string if text (e.g. from UI)
    let subjectsArr = [];
    if (role === 'teacher' && subjects) {
        subjectsArr = Array.isArray(subjects) ? subjects : subjects.split(',').map(s => s.trim());
    }

    db.createUser({ id, password, role, name, subjects: subjectsArr });
    res.json({ success: true, message: "Staff Created" });
});

app.post('/api/change-password', (req, res) => {
    const { id, oldPassword, newPassword } = req.body;
    if (!id || !oldPassword || !newPassword) return res.status(400).json({ error: "Missing fields" });

    // Validate Old
    const user = db.getUser(id, oldPassword); // This now handles hash/plain check internally!
    if (!user) return res.status(400).json({ error: "Incorrect old password" });

    // Hash New
    const bcrypt = require('bcryptjs');
    const newHash = bcrypt.hashSync(newPassword, 8);

    db.updatePassword(id, newHash);
    res.json({ success: true, message: "Password Updated" });
});

// --- V3: Gate Entry (Limit Check, No Attendance) ---
app.post('/api/entry', (req, res) => {
    const { studentId, location } = req.body;
    const student = db.getStudent(studentId);
    if (!student) return res.status(404).json({ error: "Student not found" });

    // 1. Check Inside Status
    if (logic.isInside(studentId)) return res.status(400).json({ error: "Duplicate Entry! Already Inside." });

    // 2. Check Daily Limit (Max 2)
    const limit = logic.validateGateLimit(studentId, 'entry');
    if (!limit.allowed) return res.status(400).json({ error: limit.error });

    db.addEntry({
        id: uuid.v4(),
        studentId,
        studentName: student.name,
        department: student.department,
        time: new Date(),
        location: location || "Main Gate"
    });

    res.json({ success: true, message: "Entry Logged (Gate Only)", student: student.name });
});

app.post('/api/exit', (req, res) => {
    const { studentId, location } = req.body;

    if (!logic.isInside(studentId)) return res.status(400).json({ error: "Exit Denied: Not Inside" });

    const limit = logic.validateGateLimit(studentId, 'exit');
    if (!limit.allowed) return res.status(400).json({ error: limit.error });

    db.addExit({
        id: uuid.v4(),
        studentId,
        studentName: db.getStudent(studentId).name,
        department: db.getStudent(studentId).department,
        time: new Date(),
        location: location || "Main Gate"
    });

    res.json({ success: true, message: "Exit Logged" });
});

// --- V3: Class Management ---
app.post('/api/class/start', (req, res) => {
    const { scheduleId, teacherId } = req.body;
    const result = logic.startClass(scheduleId, teacherId);
    if (result.success) res.json({ success: true, session: result.session });
    else res.status(400).json(result);
});

app.post('/api/class/scan', (req, res) => {
    const { studentId, sessionId } = req.body;
    const result = logic.markClassAttendance(studentId, sessionId);
    if (result.success) {
        // Get student details for UI feedback
        const s = db.getStudent(studentId);
        res.json({ success: true, message: "Marked Present", studentName: s ? s.name : studentId });
    }
    else res.status(400).json(result);
});

// --- Schedules (With Teacher Assignment) ---
app.get('/api/schedule', (req, res) => res.json(db.getSchedules()));
app.post('/api/schedule', (req, res) => {
    const { subject, startTime, endTime, location, teacherId, department } = req.body; // V4: department

    // V4: Conflict Check
    if (!department) return res.status(400).json({ error: "Department is required" });

    // V8: Time Validation
    if (startTime >= endTime) return res.status(400).json({ error: "End time must be after Start time" });

    const check = logic.checkScheduleConflict(teacherId, department, startTime, endTime);
    if (check.conflict) return res.status(400).json({ error: check.error });

    const current = db.getSchedules();
    current.push({ id: uuid.v4(), subject, startTime, endTime, location, teacherId, department });
    db.setSchedules(current);
    res.json({ success: true });
});

app.delete('/api/schedule/:id', (req, res) => {
    db.deleteSchedule(req.params.id);
    res.json({ success: true });
});

app.get('/api/teachers', (req, res) => {
    try {
        const teachers = db.getTeachers();
        res.json(teachers);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- Analytics & Reporting ---
app.get('/api/analytics/attendance', (req, res) => {
    const students = Object.values(db.getStudents());
    const stats = students.map(s => logic.calculateAttendance(s.id));
    res.json(stats);
});

app.get('/api/stats/trend', (req, res) => {
    // V11: Daily Trend (Last 7 Days)
    const att = db.getClassAttendance();
    const trend = {};

    // Initialize last 7 days with 0
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        trend[d.toDateString()] = 0;
    }

    // Count actual data
    att.forEach(a => {
        const d = new Date(a.time).toDateString();
        if (trend[d] !== undefined) trend[d]++;
    });

    res.json(trend);
});

// V13: Leave APIS
app.get('/api/leaves', (req, res) => res.json(db.getLeaves()));
app.post('/api/leave', (req, res) => {
    const { studentId, startDate, endDate, reason } = req.body;
    db.addLeave({
        id: uuid.v4(),
        studentId,
        startDate,
        endDate,
        reason,
        status: 'Pending',
        appliedOn: new Date()
    });
    res.json({ success: true });
});
app.put('/api/leave/:id', (req, res) => {
    const { status, approver } = req.body; // Status: Approved/Rejected
    db.updateLeave(req.params.id, status, approver);
    res.json({ success: true });
});

// V13: Admin Tools
// V9: Admin User Management
app.get('/api/users', (req, res) => {
    // Return all users (exclude passwords for security)
    const users = db.users.map(u => ({
        id: u.id,
        name: u.name,
        role: u.role,
        department: db.getStudent(u.id)?.department || (u.subjects ? u.subjects.join(', ') : '')
    }));
    res.json(users);
});

app.post('/api/admin/reset-password', (req, res) => {
    const { userId, newPassword } = req.body;
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync(newPassword, 8);
    if (db.updatePassword(userId, hash)) res.json({ success: true });
    else res.status(400).json({ error: "User not found" });
});

app.delete('/api/user/:id', (req, res) => {
    if (db.deleteUser(req.params.id)) res.json({ success: true });
    else res.status(404).json({ error: "User not found" });
});

// V15: Notice Board
app.get('/api/notices', (req, res) => res.json(db.getNotices().reverse()));
app.post('/api/notice', (req, res) => {
    const { title, content, priority } = req.body;
    db.addNotice({
        id: uuid.v4(),
        title,
        content,
        priority: priority || 'Normal',
        date: new Date()
    });
    res.json({ success: true });
});

app.get('/api/my-attendance/:id', (req, res) => res.json(logic.calculateAttendance(req.params.id)));
app.get('/api/my-history/:id', (req, res) => res.json(logic.getAttendanceHistory(req.params.id))); // V6

app.get('/api/export/csv', (req, res) => { // V6
    const students = Object.values(db.getStudents());
    const stats = students.map(s => logic.calculateAttendance(s.id));

    // Simple CSV generation
    let csv = "Student ID,Name,Department,Attended Sessions,Total Sessions,Percentage\n";
    stats.forEach(s => {
        csv += `${s.studentId},"${s.name}",${s.department},${s.attended},${s.total},${s.percentage}%\n`;
    });

    res.send(csv);
});

// V17: Teacher History
app.get('/api/teacher/history/:id', (req, res) => {
    // Get sessions started by this teacher
    const sessions = db.getClassSessions().filter(s => s.teacherId === req.params.id);
    const attendance = db.getClassAttendance();

    const history = sessions.map(sess => {
        // Count attendees for this session
        const count = attendance.filter(a => a.sessionId === sess.id).length;
        // Find schedule details for subject name
        const sched = db.getSchedules().find(sc => sc.id === sess.scheduleId);
        return {
            date: sess.startTime,
            subject: sched ? sched.subject : 'Unknown',
            department: sched ? sched.department : '-',
            count
        };
    });
    res.json(history.reverse());
});

// V17: Helpdesk
app.get('/api/tickets', (req, res) => res.json(db.getTickets().reverse()));
app.post('/api/ticket', (req, res) => {
    const { studentId, issue, description } = req.body;
    db.addTicket({
        id: uuid.v4(),
        studentId,
        issue,
        description,
        status: 'Open',
        date: new Date()
    });
    res.json({ success: true });
});
// V18 Visitor Support
app.get('/api/visitors', (req, res) => res.json(db.getVisitors().reverse()));
app.post('/api/visitor', (req, res) => {
    const v = req.body;
    v.id = uuid.v4();
    v.entryTime = new Date();
    v.status = 'Active';
    db.addVisitor(v);
    res.json({ success: true });
});
app.put('/api/visitor/checkout/:id', (req, res) => {
    if (db.checkoutVisitor(req.params.id)) res.json({ success: true });
    else res.status(404).json({ error: "Wait, visitor not found" });
});

app.put('/api/ticket/:id', (req, res) => {
    const { status, resolution } = req.body;
    db.updateTicket(req.params.id, status, resolution);
    res.json({ success: true });
});

// --- Common ---
app.get('/api/entries', (req, res) => res.json(db.getEntries().slice(-50).reverse()));
app.get('/api/exits', (req, res) => res.json(db.getExits().slice(-50).reverse()));
app.get('/api/sos', (req, res) => res.json(db.getSOS()));
app.post('/api/sos', (req, res) => {
    const { studentId, location } = req.body;
    db.addSOS({ id: uuid.v4(), studentId: studentId || "Anon", location, time: new Date(), status: 'Active' });
    res.json({ success: true });
});
app.put('/api/sos/:id', (req, res) => {
    db.updateSOS(req.params.id, { status: req.body.status });
    res.json({ success: true });
});
app.get('/api/stats', (req, res) => {
    res.json({
        totalStudents: Object.keys(db.getStudents()).length,
        dailyAttendance: new Set(db.getEntries().filter(e => new Date(e.time).toDateString() === new Date().toDateString()).map(e => e.studentId)).size,
        sosAlerts: db.getSOS().length,
        activeClasses: db.getClassSessions().length
    });
});

app.listen(PORT, () => console.log(`Server V3.1 (Updated) running on http://localhost:${PORT}`));
