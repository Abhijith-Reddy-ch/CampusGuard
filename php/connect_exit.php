<?php
header('Content-Type: application/json');
include("db_connection.php");

if (!isset($conn)) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit;
}

$studentID = $_POST['StudentID'] ?? null;
$location = $_POST['Location'] ?? null;
$exitTime = date("Y-m-d H:i:s");

if (!$studentID || !$location) {
    echo json_encode(["status" => "error", "message" => "❌ Missing required fields"]);
    exit;
}

// ✅ Check if StudentID exists in `registration` table with the EntryTime
$checkStmt = $conn->prepare("SELECT StudentID, EntryTime FROM registration WHERE StudentID = ?");
$checkStmt->bind_param("s", $studentID);
$checkStmt->execute();
$result = $checkStmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["status" => "error", "message" => "❌ Student record not found in registration table."]);
    exit;
}

// ✅ Insert into `exitlog` table
$stmt = $conn->prepare("INSERT INTO exitlog (StudentID, ExitTime, Location) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $studentID, $exitTime, $location);

if ($stmt->execute()) {
    echo json_encode(["status" => "success", "message" => "✅ Exit logged successfully!"]);
} else {
    echo json_encode(["status" => "error", "message" => "❌ Database Error: " . $conn->error]);
}

$stmt->close();
$conn->close();
?>
