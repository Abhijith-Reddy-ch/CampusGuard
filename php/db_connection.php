<?php
$host = "localhost";  // Change if using a different host
$username = "root";   // Default XAMPP username
$password = "";       // Default XAMPP password (empty)
$database = "entrylog"; // Change to your actual database name

$conn = new mysqli($host, $username, $password, $database);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>
