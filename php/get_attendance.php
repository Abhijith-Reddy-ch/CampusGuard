<?php
require 'db_connection.php';

header('Content-Type: application/json');

try {
    $stmt = $conn->prepare("
        SELECT student_id, period_id, entry_time, status 
        FROM attendance
        ORDER BY entry_time DESC
    ");
    $stmt->execute();
    $result = $stmt->get_result();

    $attendanceLogs = [];
    while ($row = $result->fetch_assoc()) {
        $attendanceLogs[] = $row;
    }

    echo json_encode($attendanceLogs);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
