<?php
error_reporting(0); // Hide warnings from breaking JSON format
header('Content-Type: application/json');

$filepath = __DIR__ . '/db_connection.php'; // Ensure correct file path
if (!file_exists($filepath)) {
    echo json_encode(["status" => "error", "message" => "Database connection file missing"]);
    exit;
}

include $filepath;

if (!isset($conn)) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit;
}

$sql = "SELECT exitlog.StudentID, registration.StudentName, exitlog.ExitTime, exitlog.Location
        FROM exitlog 
        JOIN registration ON exitlog.StudentID = registration.StudentID";

$result = $conn->query($sql);

if ($result) {
    echo json_encode($result->fetch_all(MYSQLI_ASSOC));
} else {
    echo json_encode(["status" => "error", "message" => "Database query failed"]);
}
?>
