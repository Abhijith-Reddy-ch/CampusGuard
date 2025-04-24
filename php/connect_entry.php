<?php 
$conn = new mysqli('localhost', 'root', '', 'entrylog');

if ($conn->connect_error) {
    die(json_encode(["status" => "error", "message" => "Connection failed: " . $conn->connect_error]));
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $studentID = $_POST['StudentID'];
    $studentName = $_POST['StudentName'];
    $entryTime = $_POST['EntryTime'];
    $location = $_POST['Location'];

    // Fetch Age and Department from registration table
    $stmt = $conn->prepare("SELECT Age, Department FROM registration WHERE StudentID = ?");
    $stmt->bind_param("s", $studentID);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        $age = $row['Age'];
        $department = $row['Department'];

        // Insert into registration table with required fields
        $query = "INSERT INTO registration (StudentID, StudentName, Age, Department, EntryTime, Location, HashKey) 
                  VALUES (?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($query);
        
        $hashKey = hash('sha256', $studentID . $entryTime);
        $stmt->bind_param("ssissss", $studentID, $studentName, $age, $department, $entryTime, $location, $hashKey);

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Entry logged successfully!"]);
        } else {
            if ($conn->errno === 1062) {
                echo json_encode(["status" => "error", "message" => "Duplicate entry for Student ID"]);
            } else {
                echo json_encode(["status" => "error", "message" => $conn->error]);
            }
        }

        $stmt->close();
    } else {
        echo json_encode(["status" => "error", "message" => "Student not found in registration"]);
    }
}

$conn->close();
?>
