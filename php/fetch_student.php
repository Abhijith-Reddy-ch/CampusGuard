<?php
// ✅ Enable error reporting
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$StudentID = $_GET['StudentID'];

try {
    $conn = new mysqli('localhost', 'root', '', 'entrylog');

    // ✅ Fetch student data based on the latest entry
    $stmt = $conn->prepare("SELECT StudentID, StudentName, Department, Location FROM registration WHERE StudentID = ? ORDER BY EntryTime DESC LIMIT 1");
    $stmt->bind_param("i", $StudentID);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        echo json_encode([
            "status" => "success",
            "StudentID" => $row['StudentID'],
            "StudentName" => $row['StudentName'],
            "Department" => $row['Department'],
            "Location" => $row['Location'] // ✅ Load location from the database
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "❌ Student not found!"]);
    }

    $stmt->close();
    $conn->close();
} catch (mysqli_sql_exception $e) {
    echo json_encode(["status" => "error", "message" => "❌ Database Error: " . $e->getMessage()]);
}
