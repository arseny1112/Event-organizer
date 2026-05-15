<?php
require_once '../db.php';
require_once '../helpers.php';

$user   = get_user_from_token($pdo);
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $b        = get_body();
    $event_id = (int)($b['event_id'] ?? 0);
    if (!$event_id) respond(['error' => 'Не указано мероприятие'], 422);

    try {
        $pdo->prepare(
            'INSERT INTO event_participants (event_id, user_id) VALUES (?, ?)'
        )->execute([$event_id, $user['id']]);

        // уведомления для подписчика
        $ev = $pdo->prepare('SELECT start_datetime FROM events WHERE id = ?');
        $ev->execute([$event_id]);
        $start = $ev->fetchColumn();
        $ns = $pdo->prepare(
            'INSERT IGNORE INTO notifications (event_id,user_id,notify_at,type) VALUES (?,?,?,?)'
        );
        $ns->execute([$event_id, $user['id'], date('Y-m-d H:i:s', strtotime($start)-86400), 'day_before']);
        $ns->execute([$event_id, $user['id'], date('Y-m-d H:i:s', strtotime($start)-3600),  'hour_before']);

        respond(['message' => 'Подписка оформлена']);
    } catch (PDOException $e) {
        respond(['error' => 'Вы уже подписаны'], 409);
    }
}

if ($method === 'DELETE') {
    $event_id = (int)($_GET['event_id'] ?? 0);
    if (!$event_id) respond(['error' => 'Не указано мероприятие'], 422);

    $pdo->prepare(
        'DELETE FROM event_participants WHERE event_id = ? AND user_id = ?'
    )->execute([$event_id, $user['id']]);

    $pdo->prepare(
        'DELETE FROM notifications WHERE event_id = ? AND user_id = ? AND sent = 0'
    )->execute([$event_id, $user['id']]);

    respond(['message' => 'Отписка выполнена']);
}

respond(['error' => 'Method not allowed'], 405);