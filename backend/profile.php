<?php
// backend/profile.php

// 🔥 CORS заголовки
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// Обработка preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db.php';
require_once 'helpers.php';

// Получаем пользователя из токена
$user = get_user_from_token($pdo);

if (!$user) {
    respond(['error' => 'Unauthorized', 'debug' => 'no valid token'], 401);
}

// Возвращаем данные профиля
respond([
    'id' => $user['id'],
    'name' => $user['name'],
    'email' => $user['email'],
    'role' => $user['role'] ?? 'user',
    'department' => $user['department'] ?? '',
    'lastLogin' => date('d.m.Y H:i', strtotime($user['last_login'] ?? 'now')),
]);
?>