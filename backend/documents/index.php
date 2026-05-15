<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../db.php';

try {
    // 🔥 Получаем ВСЕ документы (убрали фильтр по user_id)
    $stmt = $pdo->prepare(
        'SELECT id, original_name, filename, size, created_at 
         FROM documents 
         ORDER BY created_at DESC'
    );
    $stmt->execute();
    $documents = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 🔥 Логируем сколько нашли
    error_log('📄 Found ' . count($documents) . ' documents in database');
    
    echo json_encode($documents);
    
} catch (PDOException $e) {
    error_log('❌ Database error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error', 'message' => $e->getMessage()]);
}
exit;
?>