<?php
require 'db_connection.php';

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$period_number = $input['period_number'] ?? null;
$subject = $input['subject'] ?? null;
$start_time = $input['start_time'] ?? null;
$end_time = $input['end_time'] ?? null;
$location = $input['location'] ?? 'N/A'; // Added location

if (!$period_number || !$subject || !$start_time || !$end_time) {
    echo json_encode(['status' => 'error', 'message' => '❌ Missing required fields']);
    exit;
}

try {
    $stmt = $conn->prepare("INSERT INTO schedule (period_number, subject, start_time, end_time, location) 
                            VALUES (?, ?, ?, ?, ?) 
                            ON DUPLICATE KEY UPDATE 
                                subject = VALUES(subject), 
                                start_time = VALUES(start_time), 
                                end_time = VALUES(end_time),
                                location = VALUES(location)");

    if (!$stmt) {
        echo json_encode(['status' => 'error', 'message' => '❌ SQL Error: ' . $conn->error]);
        exit;
    }

    $stmt->bind_param("issss", $period_number, $subject, $start_time, $end_time, $location);
    $stmt->execute();

    echo json_encode(['status' => 'success', 'message' => '✅ Schedule updated successfully']);
    $stmt->close();
} catch (Exception $e) {
    error_log("❌ Error updating schedule: " . $e->getMessage());
    echo json_encode(['status' => 'error', 'message' => '❌ Exception: ' . $e->getMessage()]);
}

$conn->close();

?>
