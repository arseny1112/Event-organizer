<?php
// backend/events/stats.php

header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../db.php';
require_once '../helpers.php';

$user = get_user_from_token($pdo);

if (!$user) {
    respond(['error' => 'Unauthorized'], 401);
}

$userId = $user['id'];
$role = $user['role'] ?? 'user';

// Базовые условия
$where = $role === 'admin' 
    ? '1=1' 
    : "(e.created_by = ? OR e.department = ?)";
$params = $role === 'admin' ? [] : [$userId, $user['department'] ?? ''];

$totalWhere = $role === 'admin' ? '1=1' : 'e.created_by = ?';
$totalParams = $role === 'admin' ? [] : [$userId];

$stmt = $pdo->prepare("
    SELECT 
        (SELECT COUNT(*) FROM events e WHERE $totalWhere) as total,
        (SELECT COUNT(*) FROM events e 
         WHERE ($where) 
         AND e.start_datetime >= NOW() 
         AND e.start_datetime < DATE_ADD(NOW(), INTERVAL 7 DAY)) as week,
        (SELECT COUNT(*) FROM events e 
         WHERE ($where) 
         AND e.end_datetime < NOW()) as completed
");
$stmt->execute(array_merge($totalParams, $params, $params));
$stats = $stmt->fetch();

respond([
    'totalEvents' => (int)$stats['total'],
    'weekEvents' => (int)$stats['week'],
    'completedEvents' => (int)$stats['completed'],
]);
?>