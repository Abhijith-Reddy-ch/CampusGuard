<?php
header("Content-Type: application/json");
include 'db_connection.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['period_number'], $data['subject'], $data['start_time'], $data['end_time'], $data['location'])) {
    echo json_encode(["success" => false, "error" => "Invalid input"]);
    exit;
}

$period_number = $data['period_number'];
$subject = $data['subject'];
$start_time = $data['start_time'];
$end_time = $data['end_time'];
$location = $data['location'];

$sql = "UPDATE schedule SET subject=?, start_time=?, end_time=?, location=? WHERE period_number=?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ssssi", $subject, $start_time, $end_time, $location, $period_number);

if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "error" => $conn->error]);
}

$stmt->close();
$conn->close();
?>
