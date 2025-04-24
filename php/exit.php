<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$conn = new mysqli('localhost', 'root', '', 'entrylog');

if ($conn->connect_error) {
    die(json_encode(["status" => "error", "message" => "Database connection failed"]));
}

$StudentID = $_POST['StudentID'] ?? '';
$Location = $_POST['Location'] ?? '';
$ExitTime = date('h:i A');
$ExitDate = date('Y-m-d');

$sql = "SELECT COUNT(*) AS count FROM registration WHERE StudentID = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $StudentID);
$stmt->execute();
$stmt->bind_result($count);
$stmt->fetch();
$stmt->close();

if ($count > 0) {
    $stmt = $conn->prepare("INSERT INTO exitlog (StudentID, ExitTime, Location, ExitDate) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("isss", $StudentID, $ExitTime, $Location, $ExitDate);

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Exit logged successfully"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to log exit"]);
    }
    $stmt->close();
} else {
    echo json_encode(["status" => "error", "message" => "No entry record found for Student ID"]);
}
$sql = "INSERT INTO exitlog (StudentID, ExitTime, Location) VALUES ('$studentID', NOW(), '$location')";

if ($conn->query($sql) === TRUE) {
    echo "Exit recorded successfully!";
} else {
    echo "Error: " . $conn->error;
}


$conn->close();
print_r($_POST);
exit;

?>
