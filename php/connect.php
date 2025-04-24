<?php
// ✅ Enable error reporting
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$StudentID = $_POST['StudentID'];
$StudentName = $_POST['StudentName'];
$EntryTime = $_POST['EntryTime'];
$Department = $_POST['Department'];
$Location = $_POST['Location'];

try {
    $conn = new mysqli('localhost', 'root', '', 'entrylog');

    // ✅ Generate hash key for unique check
    $hashKey = hash('sha256', $StudentID . $EntryTime);

    // ✅ Insert into `registration`
    $stmt = $conn->prepare("INSERT INTO registration (StudentID, StudentName, EntryTime, Department, Location, HashKey) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("isssss", $StudentID, $StudentName, $EntryTime, $Department, $Location, $hashKey);
    $stmt->execute();

    // ✅ Insert into `qrdata`
    $stmt = $conn->prepare("INSERT INTO qrdata (StudentID, StudentName, EntryTime, Department) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("isss", $StudentID, $StudentName, $EntryTime, $Department);
    $stmt->execute();

    echo json_encode(["status" => "success", "message" => "✅ Entry Successful!"]);
} catch (mysqli_sql_exception $e) {
    echo json_encode(["status" => "error", "message" => "❌ Database Error: " . $e->getMessage()]);
}
