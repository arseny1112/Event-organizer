<?php
// backend/documents/delete.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../db.php';

// Получаем ID из запроса
$docId = $_GET['id'] ?? null;

if (!$docId) {
    http_response_code(400);
    echo json_encode(['error' => 'Document ID required']);
    exit;
}

try {
    // 🔥 Просто находим документ (без проверки user_id)
    $stmt = $pdo->prepare('SELECT * FROM documents WHERE id = ?');
    $stmt->execute([$docId]);
    $doc = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$doc) {
        http_response_code(404);
        echo json_encode(['error' => 'Document not found']);
        exit;
    }
    
    // Путь к файлу
    $filePath = __DIR__ . '/../uploads/documents/' . $doc['filename'];
    
    // Удаляем файл с диска
    if (file_exists($filePath)) {
        unlink($filePath);
    }
    
    // Удаляем запись из БД
    $stmt = $pdo->prepare('DELETE FROM documents WHERE id = ?');
    $stmt->execute([$docId]);
    
    echo json_encode(['message' => 'Document deleted successfully']);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error', 'message' => $e->getMessage()]);
}

exit;
?>