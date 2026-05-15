<?php
require_once '../db.php';
require_once '../helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') respond(['error' => 'Method not allowed'], 405);

$user = get_user_from_token($pdo);
$id   = (int)($_GET['id'] ?? 0);
if (!$id) respond(['error' => 'Не указан id'], 422);

$b     = get_body();
$title = trim($b['title']          ?? '');
$desc  = trim($b['description']    ?? '');
$cat   = (int)($b['category_id']   ?? 0);
$start =       $b['start_datetime'] ?? '';
$end   =       $b['end_datetime']   ?? '';

if (!$title || !$cat || !$start || !$end)
    respond(['error' => 'Заполните обязательные поля'], 422);

$stmt = $pdo->prepare(
    'UPDATE events SET title=?, description=?, category_id=?,
     start_datetime=?, end_datetime=?
     WHERE id=? AND user_id=?'
);
$stmt->execute([$title, $desc, $cat, $start, $end, $id, $user['id']]);

if ($stmt->rowCount() === 0) respond(['error' => 'Мероприятие не найдено'], 404);

// пересоздать уведомления
$pdo->prepare('DELETE FROM notifications WHERE event_id=?')->execute([$id]);
$day  = date('Y-m-d H:i:s', strtotime($start) - 86400);
$hour = date('Y-m-d H:i:s', strtotime($start) - 3600);
$ns = $pdo->prepare('INSERT INTO notifications (event_id,user_id,notify_at,type) VALUES (?,?,?,?)');
$ns->execute([$id, $user['id'], $day,  'day_before']);
$ns->execute([$id, $user['id'], $hour, 'hour_before']);

respond(['message' => 'Обновлено']);