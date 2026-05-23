<?php

ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/../db.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PUT, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {

    if (!isset($pdo)) {
        throw new Exception('PDO НЕ существует');
    }

    $input = file_get_contents('php://input');

    $data = json_decode($input, true);

    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;

    if (!$data || $id <= 0) {

        http_response_code(400);

        echo json_encode([
            'error' => 'Неверный формат данных или ID',
            'debug' => [
                'id' => $id,
                'input' => $input,
                'json_error' => json_last_error_msg()
            ]
        ]);

        exit();
    }

    $title = $data['title'] ?? '';
    $description = $data['description'] ?? '';
    $location = $data['location'] ?? '';
    $category_id = intval($data['category_id'] ?? 0);
    $start_datetime = $data['start_datetime'] ?? '';
    $end_datetime = $data['end_datetime'] ?? '';

    if (
        empty($title) ||
        empty($start_datetime) ||
        $category_id <= 0
    ) {

        http_response_code(422);

        echo json_encode([
            'error' => 'Заполните обязательные поля'
        ]);

        exit();
    }

    $sql = "
        UPDATE events SET
            title = ?,
            description = ?,
            location = ?,
            category_id = ?,
            start_datetime = ?,
            end_datetime = ?
        WHERE id = ?
    ";

    $stmt = $pdo->prepare($sql);

    if (!$stmt) {
        throw new Exception('Ошибка prepare');
    }

    $result = $stmt->execute([
        $title,
        $description,
        $location,
        $category_id,
        $start_datetime,
        $end_datetime,
        $id
    ]);

    echo json_encode([
        'success' => true,
        'result' => $result,
        'message' => 'Событие обновлено'
    ]);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        'type' => 'PDOException',
        'message' => $e->getMessage(),
        'line' => $e->getLine(),
        'file' => $e->getFile()
    ]);

} catch (Exception $e) {

    http_response_code(500);

    echo json_encode([
        'type' => 'Exception',
        'message' => $e->getMessage(),
        'line' => $e->getLine(),
        'file' => $e->getFile()
    ]);
}