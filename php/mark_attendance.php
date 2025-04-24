<?php
require 'db_connection.php';

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$student_id = $input['student_id'] ?? null;
$entry_time = date('H:i:s');

if (!$student_id) {
    echo json_encode(['status' => 'error', 'message' => 'Missing student ID']);
    exit();
}

try {
    $stmt = $conn->prepare("
        SELECT period_number, start_time, end_time, subject 
        FROM schedule 
        WHERE start_time <= ? AND end_time >= ?
        LIMIT 1
    ");
    $stmt->bind_param("ss", $entry_time, $entry_time);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        $period_number = $row['period_number'];
        $start_time = $row['start_time'];
        $subject = $row['subject'];

        $grace_time = date('H:i:s', strtotime($start_time) + (5 * 60));
        $status = (strtotime($entry_time) <= strtotime($grace_time)) ? 'Present' : 'Late';

        $stmt = $conn->prepare("
            SELECT attendance_id FROM attendance 
            WHERE student_id = ? AND period_number = ?
        ");
        $stmt->bind_param("si", $student_id, $period_number);
        $stmt->execute();
        $existing = $stmt->get_result();

        if ($existing->num_rows > 0) {
            echo json_encode(['status' => 'error', 'message' => 'Attendance already recorded']);
            exit();
        }

        $stmt = $conn->prepare("
            INSERT INTO attendance (student_id, period_number, entry_time, status, subject)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->bind_param("sisss", $student_id, $period_number, $entry_time, $status, $subject);

        if ($stmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => "Attendance marked as '$status'"]);
        } else {
            throw new Exception("Failed to save attendance: " . $stmt->error);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'No active class at this time']);
    }

    $stmt->close();
} catch (Exception $e) {
    error_log("Error marking attendance: " . $e->getMessage());
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
?>