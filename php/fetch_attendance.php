<?php
require 'db_connection.php';

header('Content-Type: application/json');

try {
    $stmt = $conn->prepare("
        SELECT a.attendance_id, a.student_id, r.StudentName AS student_name, a.period_number, s.subject, a.entry_time, a.status
        FROM attendance a
        LEFT JOIN registration r ON a.student_id = r.StudentID
        LEFT JOIN schedule s ON a.period_number = s.period_number
        ORDER BY a.entry_time DESC
    ");
    $stmt->execute();
    $result = $stmt->get_result();

    $attendanceLogs = [];
    while ($row = $result->fetch_assoc()) {
        $attendanceLogs[] = $row;
    }

    if (empty($attendanceLogs)) {
        echo json_encode(['status' => 'empty', 'message' => 'No attendance data']);
    } else {
        echo json_encode($attendanceLogs);
    }

    $stmt->close();
} catch (Exception $e) {
    error_log("Error fetching attendance: " . $e->getMessage());
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
?>