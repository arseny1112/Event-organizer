<?php
// backend/documents/upload.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../db.php';
require_once '../helpers.php';

$user = get_user_from_token($pdo);
if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$userId = $user['id'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(422);
    echo json_encode(['error' => 'File upload error']);
    exit;
}

$file = $_FILES['file'];
$eventId = $_POST['event_id'] ?? null;

$uploadDir = __DIR__ . '/../uploads/documents/';

if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$filename = uniqid('doc_', true) . '_' . time() . '.' . $extension;
$filePath = $uploadDir . $filename;

if (!move_uploaded_file($file['tmp_name'], $filePath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save file']);
    exit;
}

chmod($filePath, 0644);

try {
    $stmt = $pdo->prepare(
        'INSERT INTO documents (
            event_id, 
            user_id, 
            filename,
            original_name,
            size,
            created_at
        ) VALUES (?, ?, ?, ?, ?, NOW())'
    );
    
    $stmt->execute([
        $eventId,
        $userId,
        $filename,
        $file['name'],  // ← Оригинальное имя
        $file['size']
    ]);
    
    echo json_encode([
        'id' => (int)$pdo->lastInsertId(),
        'message' => 'File uploaded successfully',
        'filename' => $filename,
        'original_name' => $file['name']
    ]);
    
} catch (PDOException $e) {
    if (file_exists($filePath)) {
        unlink($filePath);
    }
    
    http_response_code(500);
    echo json_encode(['error' => 'Database error', 'message' => $e->getMessage()]);
}

exit;
?>