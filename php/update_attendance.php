<?php
require 'db_connection.php';

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$attendance_id = $input['attendance_id'] ?? null;
$status = $input['status'] ?? null;

if (!$attendance_id || !$status) {
    echo json_encode(['status' => 'error', 'message' => 'Missing attendance_id or status']);
    exit;
}

try {
    $stmt = $conn->prepare("
        UPDATE attendance 
        SET status = ? 
        WHERE attendance_id = ?
    ");
    $stmt->bind_param("si", $status, $attendance_id);

    if ($stmt->execute()) {
        echo json_encode(['status' => 'success', 'message' => "Attendance updated to '$status'"]);
    } else {
        throw new Exception("Failed to update attendance: " . $stmt->error);
    }

    $stmt->close();
} catch (Exception $e) {
    error_log("Error updating attendance: " . $e->getMessage());
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
?>