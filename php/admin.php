<?php
// Include database connection
include 'db_connect.php';

// Fetch Entry-Exit Logs
$entry_exit_query = "SELECT e.student_id, r.StudentName, e.entry_time, e.exit_time, e.location
                     FROM exitlog e 
                     JOIN registration r ON e.student_id = r.StudentID 
                     ORDER BY e.entry_time DESC";
$entry_exit_result = mysqli_query($conn, $entry_exit_query);

// Fetch Schedule
$schedule_query = "SELECT * FROM schedule ORDER BY class_time ASC";
$schedule_result = mysqli_query($conn, $schedule_query);
?>
