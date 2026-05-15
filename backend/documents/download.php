<?php
// backend/uploads/documents/download.php

ini_set('display_errors', 0); // Не показываем ошибки пользователю
header('Content-Type: application/octet-stream');
header('Access-Control-Allow-Origin: http://localhost:5173'); // ✅ Разрешаем твой фронтенд
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/octet-stream');

require_once '../../db.php';

$docId = $_GET['id'] ?? null;
if (!$docId) {
    http_response_code(400);
    echo json_encode(['error' => 'Document ID required']);
    exit;
}

try {
    $stmt = $pdo->prepare('SELECT filename, original_name FROM documents WHERE id = ?');
    $stmt->execute([$docId]);
    $doc = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$doc) {
        http_response_code(404);
        echo json_encode(['error' => 'Document not found']);
        exit;
    }
    
    $filePath = __DIR__ . '/' . $doc['filename'];
    
    if (!file_exists($filePath)) {
        http_response_code(404);
        echo json_encode(['error' => 'File not found on server']);
        exit;
    }
    
    // ✅ Заголовки для скачивания
    header('Content-Description: File Transfer');
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . basename($doc['original_name']) . '"');
    header('Content-Length: ' . filesize($filePath));
    header('Cache-Control: private, max-age=0, must-revalidate');
    header('Pragma: public');
    
    // ✅ Отдаём файл
    readfile($filePath);
    exit;
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error']);
    exit;
}