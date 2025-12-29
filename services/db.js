const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '../database.json');

// Initial Seed Data for V2
let data = {
    users: [
        { id: 'admin', password: 'admin123', role: 'admin', name: 'System Admin' },
        { id: 'teacher', password: 'teach123', role: 'teacher', name: 'Prof. Smith' },
        { id: 'guard', password: 'secure123', role: 'guard', name: 'Chief Security' },
        { id: 'S101', password: 'password', role: 'student', name: 'Alice Student' } // Seed student
    ],
    students: {
        'S101': { id: 'S101', name: 'Alice Student', age: 20, department: 'CS', user_id: 'S101' }
    },
    entries: [],
    exits: [],
    schedules: [],
    class_sessions: [], // V3: Logs of when a teacher started a class { id, scheduleId, teacherId, startTime }
    class_attendance: [], // V3: { sessionId, studentId, time }
    sos: []
};

// Load from file if exists
if (fs.existsSync(DB_FILE)) {
    try {
        const raw = fs.readFileSync(DB_FILE);
        const fileData = JSON.parse(raw);
        data = { ...data, ...fileData };
        if (Array.isArray(data.students)) data.students = {};
    } catch (e) {
        console.error("Error loading DB:", e);
    }
} else {
    saveData();
}

function saveData() {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

const bcrypt = require('bcryptjs');

module.exports = {
    users: data.users, // Expose for existence checks
    // Auth
    getUser: (username, password) => {
        const user = data.users.find(u => u.id === username);
        if (!user) return null;

        // V8: Smart Auth (Hash vs Plain)
        const isMatch = bcrypt.compareSync(password, user.password); // Try hash compare
        if (isMatch) return user;

        // Fallback: Check if plain text matches (Legacy support/Migration)
        if (user.password === password) {
            // Optional: Upgrade to hash on the fly? yes.
            user.password = bcrypt.hashSync(password, 8);
            saveData();
            return user;
        }
        return null; // No match
    },
    createUser: (user) => {
        // V8: Hash password
        user.password = bcrypt.hashSync(user.password, 8);
        data.users.push(user);
        saveData();
    },
    updatePassword: (id, newHash) => {
        const u = data.users.find(u => u.id === id);
        if (u) {
            u.password = newHash;
            saveData();
            return true;
        }
        return false;
    },
    deleteUser: (id) => {
        let changed = false;

        // 1. Users
        const initialU = data.users.length;
        data.users = data.users.filter(u => u.id !== id);
        if (data.users.length < initialU) changed = true;

        // 2. Students
        if (data.students[id]) {
            delete data.students[id];
            changed = true;
        }

        // 3. Cascade Delete (Logs & Related Data)
        // Entries
        const initEntries = data.entries.length;
        data.entries = data.entries.filter(e => e.studentId !== id);
        if (data.entries.length < initEntries) changed = true;

        // Exits
        const initExits = data.exits.length;
        data.exits = data.exits.filter(e => e.studentId !== id);
        if (data.exits.length < initExits) changed = true;

        // Attendance
        const initAtt = data.class_attendance.length;
        data.class_attendance = data.class_attendance.filter(a => a.studentId !== id);
        if (data.class_attendance.length < initAtt) changed = true;

        // Leaves
        if (data.leaves) {
            const initLeaves = data.leaves.length;
            data.leaves = data.leaves.filter(l => l.studentId !== id);
            if (data.leaves.length < initLeaves) changed = true;
        }

        // Tickets
        if (data.tickets) {
            const initTick = data.tickets.length;
            data.tickets = data.tickets.filter(t => t.studentId !== id);
            if (data.tickets.length < initTick) changed = true;
        }

        // SOS
        if (data.sos) {
            data.sos = data.sos.filter(s => s.studentId !== id);
            // SOS usually keep for history, but user asked for full wipe.
        }

        if (changed) {
            saveData();
            return true;
        }
        return false;
    },

    getTeachers: () => {
        return data.users.filter(u => u.role === 'teacher').map(u => ({
            id: u.id,
            name: u.name,
            subjects: u.subjects || [] // V4
        }));
    },

    // Students
    getStudents: () => data.students,
    getStudent: (id) => data.students[id],
    addStudent: (student) => {
        data.students[student.id] = student;
        saveData();
    },

    // Logs
    getEntries: () => data.entries,
    addEntry: (entry) => {
        data.entries.push(entry);
        saveData();
    },
    getExits: () => data.exits,
    addExit: (exit) => {
        data.exits.push(exit);
        saveData();
    },

    // Schedules
    getSchedules: () => data.schedules,
    setSchedules: (schedules) => {
        data.schedules = schedules;
        data.schedules.sort((a, b) => a.startTime.localeCompare(b.startTime));
        saveData();
    },
    deleteSchedule: (id) => {
        data.schedules = data.schedules.filter(s => s.id !== id);
        saveData();
    },

    // V3: Class Sessions
    addClassSession: (session) => {
        data.class_sessions.push(session);
        saveData();
    },
    getClassSessions: () => data.class_sessions,

    // V3: Class Attendance
    addClassAttendance: (att) => {
        data.class_attendance.push(att);
        saveData();
    },
    getClassAttendance: () => data.class_attendance,

    // V13: Leaves
    getLeaves: () => data.leaves || [],
    addLeave: (leave) => {
        if (!data.leaves) data.leaves = [];
        data.leaves.push(leave);
        saveData();
    },
    updateLeave: (leaveId, status, approver) => {
        const l = data.leaves.find(x => x.id === leaveId);
        if (l) {
            l.status = status;
            l.approver = approver;
            saveData();
            return true;
        }
        return false;
    },

    // V15: Notices
    getNotices: () => data.notices || [],
    addNotice: (notice) => {
        if (!data.notices) data.notices = [];
        data.notices.push(notice);
        saveData();
    },

    // SOS
    getSOS: () => data.sos,
    addSOS: (alert) => {
        data.sos.unshift(alert);
        saveData();
    },
    updateSOS: (id, updates) => {
        const alert = data.sos.find(a => a.id === id);
        if (alert) Object.assign(alert, updates);
        saveData();
    },

    // V17: Helpdesk Tickets
    getTickets: () => data.tickets || [],
    addTicket: (ticket) => {
        if (!data.tickets) data.tickets = [];
        data.tickets.push(ticket);
        saveData();
    },
    updateTicket: (id, status, resolution) => {
        const t = data.tickets.find(x => x.id === id);
        if (t) {
            t.status = status;
            t.resolution = resolution;
            saveData();
            return true;
        }
        return false;
    },

    // V18: Visitor Management
    getVisitors: () => data.visitors || [],
    addVisitor: (v) => {
        if (!data.visitors) data.visitors = [];
        data.visitors.push(v);
        saveData();
    },
    checkoutVisitor: (id) => {
        const v = data.visitors.find(x => x.id === id);
        if (v) {
            v.exitTime = new Date();
            v.status = 'Checked Out';
            saveData();
            return true;
        }
        return false;
    }
};
