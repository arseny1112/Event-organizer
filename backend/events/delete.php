<?php
require_once '../db.php';
require_once '../helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') respond(['error' => 'Method not allowed'], 405);

$user = get_user_from_token($pdo);
$id   = (int)($_GET['id'] ?? 0);
if (!$id) respond(['error' => 'Не указан id'], 422);

$stmt = $pdo->prepare('DELETE FROM events WHERE id=? AND user_id=?');
$stmt->execute([$id, $user['id']]);

if ($stmt->rowCount() === 0) respond(['error' => 'Мероприятие не найдено'], 404);
respond(['message' => 'Удалено']);