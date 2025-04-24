<?php
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    $conn = new mysqli('localhost', 'root', '', 'entrylog');

    $StudentID = $_POST['StudentID'] ?? null;
    $StudentName = $_POST['StudentName'] ?? null;
    $Age = $_POST['Age'] ?? null;
    $Department = $_POST['Department'] ?? null;

    if (!$StudentID || !$StudentName || !$Age || !$Department) {
        echo json_encode(["status" => "error", "message" => "Missing required fields"]);
        exit;
    }

    // Validate Student ID format
    if (!preg_match("/^[A-Z]{2}\.[A-Z]{2}\.U\d[A-Z]{3}\d{5}$/", $StudentID)) {
        echo json_encode(["status" => "error", "message" => "Invalid Student ID format. Expected format: XX.XX.U4XXX12345"]);
        exit;
    }

    // Check for duplicate Student ID
    $stmt = $conn->prepare("SELECT * FROM registration WHERE StudentID = ?");
    $stmt->bind_param("s", $StudentID);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        echo json_encode(["status" => "error", "message" => "Duplicate Entry: This Student ID is already registered!"]);
        exit;
    }

    // Generate hash key for uniqueness
    $hashKey = hash('sha256', $StudentID);

    // Insert into registration table
    $stmt = $conn->prepare("INSERT INTO registration (StudentID, StudentName, Age, Department, HashKey) 
                            VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("ssiss", $StudentID, $StudentName, $Age, $Department, $hashKey);
    $stmt->execute();

    // Generate QR code data
    $qrData = json_encode([
        "StudentID" => $StudentID,
        "StudentName" => $StudentName,
        "Age" => $Age,
        "Department" => $Department
    ]);

    // Insert into qrdata table
    $stmt = $conn->prepare("INSERT INTO qrdata (StudentID, StudentName, Age, Department, QRData) 
                            VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("ssiss", $StudentID, $StudentName, $Age, $Department, $qrData);
    $stmt->execute();

    echo json_encode(["status" => "success", "message" => "Entry Successful!", "qrData" => $qrData]);

    $stmt->close();
    $conn->close();
} catch (mysqli_sql_exception $e) {
    echo json_encode(["status" => "error", "message" => "Database Error: " . $e->getMessage()]);
}
?>
