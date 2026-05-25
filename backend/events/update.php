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
            'debug' => ['id' => $id, 'input' => $input]
        ]);
        exit();
    }

    $title = $data['title'] ?? '';
    $description = $data['description'] ?? '';
    $location = $data['location'] ?? '';
    $category_id = intval($data['category_id'] ?? 0);
    $start_datetime = $data['start_datetime'] ?? '';
    $end_datetime = $data['end_datetime'] ?? '';

    if (empty($title) || empty($start_datetime) || $category_id <= 0) {
        http_response_code(422);
        echo json_encode(['error' => 'Заполните обязательные поля']);
        exit();
    }

    $sql = "UPDATE events SET
            title = ?,
            description = ?,
            location = ?,
            category_id = ?,
            start_datetime = ?,
            end_datetime = ?
        WHERE id = ?";

    $stmt = $pdo->prepare($sql);
    if (!$stmt) {
        throw new Exception('Ошибка prepare');
    }

    $stmt->execute([
        $title,
        $description,
        $location,
        $category_id,
        $start_datetime,
        $end_datetime,
        $id
    ]);

    $users_stmt = $pdo->prepare('SELECT DISTINCT user_id FROM notifications WHERE event_id = ?');
    $users_stmt->execute([$id]);
    $userIds = $users_stmt->fetchAll(PDO::FETCH_COLUMN);

    $pdo->prepare('DELETE FROM notifications WHERE event_id = ? AND sent = 0')->execute([$id]);

    $start = new DateTime($start_datetime);

    foreach ($userIds as $userId) {
        $dayBefore = (clone $start)->modify('-1 day');
        if ($dayBefore > new DateTime()) {
            $pdo->prepare('INSERT INTO notifications (user_id, event_id, type, notify_at, sent) VALUES (?, ?, ?, ?, 0)')
                ->execute([$userId, $id, 'day_before', $dayBefore->format('Y-m-d H:i:s')]);
        }

        $hourBefore = (clone $start)->modify('-1 hour');
        if ($hourBefore > new DateTime()) {
            $pdo->prepare('INSERT INTO notifications (user_id, event_id, type, notify_at, sent) VALUES (?, ?, ?, ?, 0)')
                ->execute([$userId, $id, 'hour_before', $hourBefore->format('Y-m-d H:i:s')]);
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Событие обновлено'
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

