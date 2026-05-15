<?php
require_once '../db.php';
require_once '../helpers.php';

$user   = get_user_from_token($pdo);
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->prepare('SELECT * FROM settings WHERE user_id = ?');
    $stmt->execute([$user['id']]);
    $s = $stmt->fetch();

    if (!$s) {
        // 🔥 Создаём с явными безопасными дефолтами
        $pdo->prepare(
            'INSERT INTO settings (
                user_id,
                vk_notify,
                notify_day_before,
                notify_hour_before,
                email_notify,
                vk_id
            ) VALUES (?, 0, 1, 1, 0, NULL)'
        )->execute([$user['id']]);
        
        $stmt->execute([$user['id']]);
        $s = $stmt->fetch();
    }

    respond([
        'vk_notify'          => (bool)$s['vk_notify'],
        'notify_day_before'  => (bool)$s['notify_day_before'],
        'notify_hour_before' => (bool)$s['notify_hour_before'],
        'email_notify'       => (bool)$s['email_notify'],
        'vk_id'              => $s['vk_id'],
    ]);
}

if ($method === 'PUT') {
    $b = get_body();
    
    // 1. Обновляем настройки в таблице settings
    $stmt = $pdo->prepare(
        'UPDATE settings SET
         vk_notify=?, notify_day_before=?, notify_hour_before=?,
         email_notify=?, vk_id=?
         WHERE user_id=?'
    );
    $stmt->execute([
        (int)($b['vk_notify']          ?? 0),
        (int)($b['notify_day_before']  ?? 0),
        (int)($b['notify_hour_before'] ?? 0),
        (int)($b['email_notify']       ?? 0),
        $b['vk_id'] ?? null,
        $user['id'],
    ]);
    
    // 🔥 2. Обновляем email в таблице users (ЭТОГО НЕ ХВАТАЛО!)
    if (!empty($b['email'])) {
        $stmt = $pdo->prepare('UPDATE users SET email = ? WHERE id = ?');
        $stmt->execute([$b['email'], $user['id']]);
    }
    
    respond(['message' => 'Настройки сохранены']);
}

respond(['error' => 'Method not allowed'], 405);