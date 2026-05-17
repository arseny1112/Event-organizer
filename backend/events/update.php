<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PUT, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Чтение тела запроса
$input = file_get_contents('php://input');

// --- ОТЛАДКА ---
error_log("RAW INPUT: [" . $input . "]");
error_log("INPUT LENGTH: " . strlen($input));
// ---------------

$data = json_decode($input, true);

// --- ОТЛАДКА ---
error_log("JSON DECODE RESULT: " . var_export($data, true));
error_log("JSON ERROR: " . json_last_error_msg());
// ---------------

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

error_log("ID FROM GET: " . $id);

if (!$data || $id <= 0) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Неверный формат данных или ID', 
        'debug' => [
            'id' => $id,
            'raw_input_length' => strlen($input),
            'json_error' => json_last_error_msg(),
            'decoded_data' => $data
        ]
    ]);
    exit();
}

// ... остальной код ...
?>


// Извлекаем поля (с проверкой на пустоту, если они обязательные)
$title = $data['title'] ?? '';
$description = $data['description'] ?? '';
$location = $data['location'] ?? '';
$category_id = $data['category_id'] ?? 0;
$start_datetime = $data['start_datetime'] ?? '';
$end_datetime = $data['end_datetime'] ?? '';

// ВАЛИДАЦИЯ (та самая, которая выдавала ошибку "Заполните обязательные поля")
if (empty($title) || empty($start_datetime) || $category_id <= 0) {
    http_response_code(422);
    echo json_encode(['error' => 'Заполните обязательные поля']);
    exit();
}

// Подготовка SQL запроса (используем подготовленные выражения для безопасности!)
$sql = "UPDATE events SET 
        title = ?, 
        description = ?, 
        location = ?, 
        category_id = ?, 
        start_datetime = ?, 
        end_datetime = ? 
        WHERE id = ?";

$stmt = $pdo->prepare($sql);

try {
    $stmt->execute([
        $title,
        $description,
        $location,
        $category_id,
        $start_datetime,
        $end_datetime,
        $id
    ]);

    echo json_encode(['success' => true, 'message' => 'Событие обновлено']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка базы данных: ' . $e->getMessage()]);
}
?>