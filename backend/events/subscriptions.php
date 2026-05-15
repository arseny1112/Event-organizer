<?php
require_once '../db.php';
require_once '../helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') respond(['error' => 'Method not allowed'], 405);

$user = get_user_from_token($pdo);

$stmt = $pdo->prepare(
    'SELECT e.*, c.name as category_name
     FROM events e
     JOIN categories c ON e.category_id = c.id
     JOIN event_participants ep ON ep.event_id = e.id
     WHERE ep.user_id = ?
     ORDER BY e.start_datetime ASC'
);
$stmt->execute([$user['id']]);
respond($stmt->fetchAll());