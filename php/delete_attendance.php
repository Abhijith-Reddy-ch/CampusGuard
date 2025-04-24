<?php
require 'db_connection.php';

header('Content-Type: application/json');

$attendance_id = $_POST['attendance_id'];

$stmt = $conn->prepare("
    DELETE FROM attendance 
    WHERE attendance_id = ?
");
$stmt->bind_param("i", $attendance_id);

if ($stmt->execute()) {
    echo json_encode(['status' => 'success', 'message' => 'Attendance deleted']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Failed to delete attendance']);
}

$conn->close();
?>
