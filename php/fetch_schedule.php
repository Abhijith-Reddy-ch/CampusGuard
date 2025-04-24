<?php
header("Content-Type: application/json");
include 'db_connection.php';

if (!$conn) {
    echo json_encode(["error" => "Database connection failed"]);
    exit;
}

$sql = "SELECT period_number, subject, start_time, end_time, location FROM schedule";
$result = $conn->query($sql);

$schedule = $result->fetch_all(MYSQLI_ASSOC);
echo json_encode($schedule);

$conn->close();
?>
