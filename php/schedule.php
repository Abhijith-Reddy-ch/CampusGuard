<?php
// Enable error reporting
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

// Get POST data
$periodNumber = $_POST['period_number'];
$subject = $_POST['subject'];
$startTime = $_POST['start_time'];
$endTime = $_POST['end_time'];
$location = $_POST['location'];

$response = [];

try {
    // Database connection
    $conn = new mysqli('localhost', 'root', '', 'entrylog');

    // Prepare SQL query
    $stmt = $conn->prepare("
        INSERT INTO schedule (period_number, subject, start_time, end_time, location) 
        VALUES (?, ?, ?, ?, ?) 
        ON DUPLICATE KEY UPDATE 
            subject = VALUES(subject), 
            start_time = VALUES(start_time), 
            end_time = VALUES(end_time),
            location = VALUES(location)
    ");

    // Bind parameters (use "s" for string, "i" for integer)
    $stmt->bind_param("issss", $periodNumber, $subject, $startTime, $endTime, $location);

    // Execute query
    $stmt->execute();

    // Success response
    $response['status'] = 'success';
    $response['message'] = "✅ Schedule Updated!";
    
    // Close connections
    $stmt->close();
    $conn->close();

} catch (mysqli_sql_exception $e) {
    $response['status'] = 'error';
    $response['message'] = "❌ Database Error: " . $e->getMessage();
}

echo json_encode($response);
?>
