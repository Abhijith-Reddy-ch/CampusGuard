<?php
require 'db_connection.php';

header('Content-Type: application/json');

$current_time = date('H:i:s');

$stmt = $conn->prepare("
    SELECT start_time, end_time 
    FROM schedule 
    WHERE start_time <= ? AND end_time >= ?
    LIMIT 1
");
$stmt->bind_param("ss", $current_time, $current_time);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    echo json_encode([
        'success' => true,
        'start_time' => $row['start_time'],
        'end_time' => $row['end_time']
    ]);
} else {
    echo json_encode(['success' => false]);
}

$conn->close();
?>
