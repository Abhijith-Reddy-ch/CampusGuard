<?php
require 'db_connection.php'; // Ensure database connection is included

header('Content-Type: application/json');
$data = json_decode(file_get_contents("php://input"), true);

$period_number = $data['period_number'];
$start_time = $data['start_time'];
$end_time = $data['end_time'];

// SQL Query to check for overlapping classes
$query = "SELECT * FROM schedule 
          WHERE period_number != ? 
          AND ((start_time <= ? AND end_time > ?) 
          OR (start_time < ? AND end_time >= ?) 
          OR (start_time >= ? AND end_time <= ?))";

$stmt = $conn->prepare($query);
$stmt->bind_param("issssss", $period_number, $start_time, $start_time, $end_time, $end_time, $start_time, $end_time);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    echo json_encode(["conflict" => true]);
} else {
    echo json_encode(["conflict" => false]);
}

$stmt->close();
$conn->close();
?>
