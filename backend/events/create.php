<?php
// backend/events/create.php

require_once '../db.php';
require_once '../helpers.php';

$user = get_user_from_token($pdo);
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    respond(['error' => 'Method not allowed'], 405);
}

$b = get_body();

// Валидация
if (empty($b['title']) || empty($b['start'])) {
    respond(['error' => 'Title and start are required'], 400);
}

$title = trim($b['title']);
$desc = trim($b['description'] ?? '');
$location = trim($b['location'] ?? '');
$start = $b['start']; // ISO формат: 2026-05-14T14:20:00
$end = $b['end'] ?? null;

try {
    $pdo->beginTransaction();

    // 1. Создаём событие
    $stmt = $pdo->prepare("
        INSERT INTO events (title, description, location, start_datetime, end_datetime, created_by) 
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$title, $desc, $location, $start, $end, $user['id']]);
    $event_id = $pdo->lastInsertId();

    // 2. Добавляем создателя как участника
    $stmt = $pdo->prepare("INSERT INTO event_participants (event_id, user_id) VALUES (?, ?)");
    $stmt->execute([$event_id, $user['id']]);

    // 3. Создаём отложенные уведомления (для cron)
    $event_dt = new DateTime($start);
    $now = new DateTime();

    // 🔥 Уведомление "за день" — ТОЛЬКО если событие завтра или позже
    $notify_day = clone $event_dt;
    $notify_day->modify('-1 day');
    
    if ($notify_day > $now) {
        $stmt = $pdo->prepare("
            INSERT INTO notifications (event_id, user_id, notify_at, type) 
            VALUES (?, ?, ?, 'day_before')
        ");
        $stmt->execute([$event_id, $user['id'], $notify_day->format('Y-m-d H:i:s')]);
    }

    // 🔥 Уведомление "за час" — всегда создаём
    $notify_hour = clone $event_dt;
    $notify_hour->modify('-1 hour');
    
    $stmt = $pdo->prepare("
        INSERT INTO notifications (event_id, user_id, notify_at, type) 
        VALUES (?, ?, ?, 'hour_before')
    ");
    $stmt->execute([$event_id, $user['id'], $notify_hour->format('Y-m-d H:i:s')]);

    $pdo->commit();

    // 4. 🔥 ОТПРАВЛЯЕМ МГНОВЕННЫЕ УВЕДОМЛЕНИЯ СОЗДАТЕЛЮ
    $notification_data = [
        'title' => $title,
        'start_datetime' => $start,
        'location' => $location,
        'description' => $desc,
        'event_id' => $event_id
    ];
    
    // Email (если включено)
    sendEmailNotification($pdo, $user['id'], 'event_created', $notification_data);
    
    // VK (если привязано)
    sendVKNotification($pdo, $user['id'], 'event_created', $notification_data);

    respond([
        'message' => 'Событие создано',
        'event_id' => $event_id
    ]);

} catch (PDOException $e) {
    $pdo->rollBack();
    error_log('Create event error: ' . $e->getMessage());
    respond(['error' => 'Database error'], 500);
}

// ============================================================================
// ФУНКЦИИ ОТПРАВКИ УВЕДОМЛЕНИЙ
// ============================================================================

/**
 * Отправка Email уведомления
 *//**
 * Отправка Email уведомления
 */
/**
 * Отправка Email уведомления
 */
function sendEmailNotification($pdo, int $userId, string $type, array $data): void {
    // Проверяем настройки пользователя
    $stmt = $pdo->prepare("
        SELECT u.email, s.email_notify 
        FROM users u 
        LEFT JOIN settings s ON s.user_id = u.id 
        WHERE u.id = ?
    ");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    if (!$user || !$user['email_notify'] || empty($user['email'])) {
        return; // Email выключен или нет почты
    }
    
    // 🔥 Формируем тему
    if ($type === 'event_created') {
        $subject = '📅 Создано новое мероприятие: ' . $data['title'];
    } elseif ($type === 'event_reminder') {
        $subject = '⏰ Напоминание: ' . $data['title'];
    } else {
        $subject = 'Уведомление';
    }
    
    // 🔥 Инициализируем сообщение (ЭТОЙ СТРОКИ НЕ ХВАТАЛО!)
    $message = "Здравствуйте!\n\n";
    
    // 🔥 Добавляем текст в зависимости от типа
    if ($type === 'event_created') {
        $message .= "Вы создали новое мероприятие:\n";
    } elseif ($type === 'event_reminder') {
        $message .= "Напоминаем о предстоящем мероприятии:\n";
    }
    
    $message .= "📌 {$data['title']}\n";
    
    if (!empty($data['start_datetime'])) {
        $dt = new DateTime($data['start_datetime']);
        $message .= "🕐 {$dt->format('d.m.Y H:i')}\n";
    }
    
    if (!empty($data['location'])) {
        $message .= "📍 {$data['location']}\n";
    }
    
    if (!empty($data['description'])) {
        $message .= "\n{$data['description']}\n";
    }
    
    // 🔥 Отправка через PHPMailer
    require_once __DIR__ . '/../email.php';
    sendEmail($user['email'], $subject, $message);
}

/**
 * Отправка VK уведомления
 */
function sendVKNotification($pdo, int $userId, string $type, array $data): void {
    // Проверяем настройки пользователя
    $stmt = $pdo->prepare("
        SELECT u.vk_id, s.vk_notify 
        FROM users u 
        LEFT JOIN settings s ON s.user_id = u.id 
        WHERE u.id = ?
    ");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    if (!$user || !$user['vk_notify'] || empty($user['vk_id'])) {
        return; // VK выключен или не привязан
    }
    
    
    $message .= "📌 {$data['title']}\n";
    
    if (!empty($data['start_datetime'])) {
        $dt = new DateTime($data['start_datetime']);
        $message .= "🕐 {$dt->format('d.m.Y H:i')}\n";
    }
    
    if (!empty($data['location'])) {
        $message .= "📍 {$data['location']}\n";
    }
    
    // Отправка через VK API
    $accessToken = 'vk1.a.6jpksTBxf8rTJn0xNYsLSPA48UXGWgBxwx716enHwfkZeIfla3N0amoZYD9myOYouIp5qE5rHZ-ysN9ifcf6FuqygHivPa9o4407Xrplxiy3_W8qFoRVe_y4AV3rEgQMj6aMX2Yf-AVK6X19kX7cwUJxUhFFtXLgl7AZAvo1lNfkEHi3UsYb7oPNvD2JYEhegqbNP3iYDmcPC0a2vRI8jQ';
    $groupId = '238638283';
    
    $params = [
        'user_id' => $user['vk_id'],
        'message' => $message,
        'random_id' => rand(0, 1000000000),
        'group_id' => $groupId,
        'access_token' => $accessToken,
        'v' => '5.199'
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://api.vk.com/method/messages.send");
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $response = curl_exec($ch);
    curl_close($ch);
    
    // Логируем ошибку если есть
    $result = json_decode($response, true);
    if (isset($result['error'])) {
        error_log("VK send error: " . json_encode($result['error']));
    }
}
?>