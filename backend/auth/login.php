<?php
require_once '../../.php';
require_once '../../helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Method not allowed'], 405);

$body  = get_body();
$email = trim($body['email']    ?? '');
$pass  =      $body['password'] ?? '';

if (!$email || !$pass) respond(['error' => 'Заполните все поля'], 422);

$stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($pass, $user['password_hash']))
    respond(['error' => 'Неверный email или пароль'], 401);

    respond([
        'token' => $user['vk_token'],
        'name'  => $user['name'],
        'email' => $user['email'],
        'role'  => $user['role'],
    ]);