const db = require('./db');
const uuid = require('uuid');

function isInside(studentId) {
    const entries = db.getEntries().filter(e => e.studentId === studentId);
    const exits = db.getExits().filter(e => e.studentId === studentId);
    if (!entries.length) return false;
    return entries.length > exits.length;
}

function validateGateLimit(studentId, type) {
    const today = new Date().toDateString();
    if (type === 'entry') {
        const todayEntries = db.getEntries().filter(e =>
            e.studentId === studentId && new Date(e.time).toDateString() === today
        );
        if (todayEntries.length >= 2) return { allowed: false, error: "Daily Entry Limit Reached (Max 2)." };
    } else {
        const todayExits = db.getExits().filter(e =>
            e.studentId === studentId && new Date(e.time).toDateString() === today
        );
        if (todayExits.length >= 2) return { allowed: false, error: "Daily Exit Limit Reached (Max 2)." };
    }
    return { allowed: true };
}

function startClass(scheduleId, teacherId) {
    const schedule = db.getSchedules().find(s => s.id === scheduleId);
    if (!schedule) return { success: false, error: "Schedule not found" };

    if (schedule.teacherId && schedule.teacherId !== teacherId) {
        return { success: false, error: "Not authorized for this class" };
    }

    const session = {
        id: uuid.v4(),
        scheduleId,
        teacherId,
        startTime: new Date(),
        subject: schedule.subject,
        department: schedule.department // V5: Store Dept
    };
    db.addClassSession(session);
    return { success: true, session };
}

function markClassAttendance(studentId, sessionId) {
    if (!isInside(studentId)) return { success: false, error: "Student not inside Campus Gate" };

    const existing = db.getClassAttendance().find(a => a.sessionId === sessionId && a.studentId === studentId);
    if (existing) return { success: false, error: "Already marked present" };

    // V10: Late Logic
    const session = db.getClassSessions().find(s => s.id === sessionId);
    if (!session) return { success: false, error: "Session invalid" };

    const now = new Date();
    const start = new Date(session.startTime);
    const diffMins = (now - start) / 1000 / 60;

    let status = 'Present';

    if (diffMins > 30) {
        return { success: false, error: "Attendance Closed (>30 mins late)" };
    } else if (diffMins > 10) {
        status = 'Late';
    }

    db.addClassAttendance({
        id: uuid.v4(),
        sessionId,
        studentId,
        time: now,
        status: status // Store status
    });

    return { success: true, message: status === 'Late' ? "Marked Late" : "Marked Present" };
}

// V4: Conflict Detection
function checkScheduleConflict(teacherId, department, startTime, endTime) {
    const allSchedules = db.getSchedules();

    // Check Teacher Conflict (Teacher can't be in 2 places)
    const teacherConflict = allSchedules.find(s => {
        return s.teacherId === teacherId && isTimeOverlap(s.startTime, s.endTime, startTime, endTime);
    });
    if (teacherConflict) return { conflict: true, error: `Teacher busy at this time (Class: ${teacherConflict.subject})` };

    // Check Student/Dept Conflict (Dept can't have 2 classes)
    const deptConflict = allSchedules.find(s => {
        // Assume 'department' field exists in schedule or match by convention. V4 adds strict 'department' to schedule.
        return s.department === department && isTimeOverlap(s.startTime, s.endTime, startTime, endTime);
    });
    if (deptConflict) return { conflict: true, error: `Department ${department} already has a class: ${deptConflict.subject}` };

    return { conflict: false };
}

function isTimeOverlap(startA, endA, startB, endB) {
    return (startA < endB && endA > startB);
}

function calculateAttendance(studentId) {
    const student = db.getStudent(studentId);
    if (!student) return { studentId, percentage: 0 };

    // V5: Only count sessions matching student department
    let sessions = db.getClassSessions().filter(s => s.department === student.department);

    // V13: Exclude Approved Leaves
    const leaves = db.getLeaves().filter(l => l.studentId === studentId && l.status === 'Approved');

    // Logic: If session date falls in any leave range, exclude it.
    if (leaves.length > 0) {
        sessions = sessions.filter(session => {
            const sessionDate = new Date(session.startTime); // Time part matters
            const sessionDateStr = sessionDate.toDateString(); // Compare dates only? Or time? 
            // Usually leave is by date.

            // Check if this date is in any leave
            const isExempt = leaves.some(l => {
                const start = new Date(l.startDate);
                const end = new Date(l.endDate);
                // Reset times for pure date comparison
                if (sessionDate >= start && sessionDate <= end) return true;
                // Simple string check for same-day
                if (new Date(l.startDate).toDateString() === sessionDateStr) return true;
                return false;
            });
            return !isExempt;
        });
    }

    const myAtt = db.getClassAttendance().filter(a => a.studentId === studentId);

    // Re-filter attended? 
    // If sessions were removed, attended should be relevant to *remaining* sessions.
    // However, if they attended WHILE on leave (unlikely), it counts. 
    // Standard: Count attended for Only Valid Sessions.
    const attendedCount = sessions.reduce((acc, sess) => {
        const didAttend = myAtt.find(a => a.sessionId === sess.id);
        if (didAttend) return acc + 1;
        return acc;
    }, 0);

    const totalCurrent = sessions.length;
    // V5: If 0 classes total, show 100% to avoid initial 'Low Attendance' warning
    let pct = totalCurrent === 0 ? 100 : (attendedCount / totalCurrent) * 100;

    return {
        studentId,
        name: student.name,
        department: student.department,
        attended: attendedCount,
        total: totalCurrent,
        percentage: parseFloat(pct.toFixed(1))
    };
}

// V6: Detailed History
function getAttendanceHistory(studentId) {
    const student = db.getStudent(studentId);
    if (!student) return [];

    const history = [];
    const sessions = db.getClassSessions().filter(s => s.department === student.department);
    const myAtt = db.getClassAttendance().filter(a => a.studentId === studentId);

    // Sort sessions by date desc
    sessions.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

    sessions.forEach(s => {
        const attended = myAtt.find(a => a.sessionId === s.id);

        let statusDisplay = 'Absent';
        if (attended) {
            statusDisplay = attended.status || 'Present'; // V10: Use stored status
        }

        history.push({
            date: new Date(s.startTime).toLocaleString(),
            subject: s.subject,
            teacherId: s.teacherId,
            status: statusDisplay,
            time: attended ? new Date(attended.time).toLocaleTimeString() : '-'
        });
    });

    // V9: Limit to last 20 for performance
    return history.slice(0, 20);
}

module.exports = {
    isInside,
    validateGateLimit,
    startClass,
    markClassAttendance,
    checkScheduleConflict,
    calculateAttendance,
    getAttendanceHistory
};
