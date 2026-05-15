<?php
// backend/cron.php

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/email.php'; // 🔥 Подключаем PHPMailer

$vkToken   = 'vk1.a.6jpksTBxf8rTJn0xNYsLSPA48UXGWgBxwx716enHwfkZeIfla3N0amoZYD9myOYouIp5qE5rHZ-ysN9ifcf6FuqygHivPa9o4407Xrplxiy3_W8qFoRVe_y4AV3rEgQMj6aMX2Yf-AVK6X19kX7cwUJxUhFFtXLgl7AZAvo1lNfkEHi3UsYb7oPNvD2JYEhegqbNP3iYDmcPC0a2vRI8jQ';
$vkGroupId = '238638283';

// Находим уведомления которые пора отправить
$stmt = $pdo->prepare(
    'SELECT n.*, 
            e.title, e.start_datetime, e.location,
            u.name as user_name, u.vk_id, u.email,
            s.vk_notify, s.email_notify
     FROM notifications n
     JOIN events e  ON n.event_id = e.id
     JOIN users u   ON n.user_id  = u.id
     LEFT JOIN settings s ON s.user_id = u.id
     WHERE n.sent = 0
       AND n.notify_at <= NOW()
       AND NOT (
         n.type = "day_before" 
         AND e.start_datetime <= DATE_ADD(NOW(), INTERVAL 2 HOUR)
       )'
);
$stmt->execute();
$notifications = $stmt->fetchAll();

foreach ($notifications as $notif) {
    $type    = $notif['type'] === 'day_before' ? 'за 1 день' : 'за 1 час';
    $date    = date('d.m.Y H:i', strtotime($notif['start_datetime']));
    $location = $notif['location'] ? "\n📍 {$notif['location']}" : '';

    $message = "🔔 Напоминание {$type} до мероприятия!\n\n"
             . "📋 {$notif['title']}\n"
             . "🕐 {$date}"
             . $location;
    
    $emailSubject = "⏰ Напоминание: {$notif['title']}";

    // 🔥 Email уведомление
    if ($notif['email_notify'] && !empty($notif['email'])) {
        if (sendEmail($notif['email'], $emailSubject, $message)) {
            echo "✅ Email отправлен пользователю {$notif['user_name']} ({$notif['email']})\n";
        } else {
            echo "❌ Ошибка Email для {$notif['email']}\n";
        }
    }

    // 🔥 VK уведомление
    if ($notif['vk_notify'] && $notif['vk_id']) {
        $params = [
            'user_id'   => $notif['vk_id'],
            'message'   => $message,
            'random_id' => rand(0, 1000000000),
            'access_token' => $vkToken,
            'v'         => '5.199',
        ];

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => 'https://api.vk.com/method/messages.send',
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => http_build_query($params),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
        ]);
        $response = curl_exec($ch);
        curl_close($ch);

        $result = json_decode($response, true);
        
        if (isset($result['response'])) {
            echo "✅ VK отправлено пользователю {$notif['user_name']} ({$notif['vk_id']})\n";
        } else {
            echo "❌ Ошибка VK для {$notif['user_name']}: " . json_encode($result['error'] ?? $result) . "\n";
        }
    }

    // Помечаем как отправленное
    $pdo->prepare('UPDATE notifications SET sent = 1 WHERE id = ?')
        ->execute([$notif['id']]);
}

echo "Готово. Обработано: " . count($notifications) . " уведомлений.\n";
?>