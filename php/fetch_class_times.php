<?php
require 'db_connection.php';

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$student_id = $input['student_id'] ?? null;

if (!$student_id) {
    echo json_encode(['status' => 'error', 'message' => '❌ Missing student_id']);
    exit;
}

try {
    // Fetch the earliest scheduled class time for the student
    $stmt = $conn->prepare("
        SELECT s.start_time, s.end_time 
        FROM schedule s
        JOIN registration r ON s.location = r.classroom
        WHERE r.student_id = ?
        ORDER BY s.start_time ASC
        LIMIT 1
    ");

    if (!$stmt) {
        echo json_encode(['status' => 'error', 'message' => '❌ SQL Error: ' . $conn->error]);
        exit;
    }

    $stmt->bind_param("s", $student_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        echo json_encode([
            'status' => 'success',
            'start_time' => $row['start_time'],
            'end_time' => $row['end_time']
        ]);
    } else {
        echo json_encode([
            'status' => 'success',
            'message' => '⚠ No schedule found',
            'start_time' => 'N/A',
            'end_time' => 'N/A'
        ]);
    }

    $stmt->close();
} catch (Exception $e) {
    error_log("❌ Error fetching class times: " . $e->getMessage());
    echo json_encode(['status' => 'error', 'message' => '❌ Exception: ' . $e->getMessage()]);
}

$conn->close();
?>
