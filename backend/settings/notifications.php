<?php
// backend/settings/notifications.php

header('Content-Type: application/json');
require_once '../db.php';
require_once '../helpers.php';

$user = get_user_from_token($pdo);
$method = $_SERVER['REQUEST_METHOD'];

// Получение текущих настроек
if ($method === 'GET') {
    try {
        $stmt = $pdo->prepare(
            'SELECT vk_notifications_enabled, vk_profile_url, 
                    email_notifications_enabled, work_email, email_confirmed
             FROM users 
             WHERE id = ?'
        );
        $stmt->execute([$user['id']]);
        $settings = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($settings) {
            respond($settings);
        } else {
            respond(['error' => 'Settings not found'], 404);
        }
    } catch (PDOException $e) {
        respond(['error' => 'Database error'], 500);
    }
}

// Обновление настроек
if ($method === 'PUT') {
    $body = json_decode(file_get_contents('php://input'), true);
    
    $vkEnabled = $body['vk_notifications_enabled'] ?? 0;
    $vkProfile = $body['vk_profile_url'] ?? '';
    $emailEnabled = $body['email_notifications_enabled'] ?? 0;
    $workEmail = $body['work_email'] ?? '';
    
    try {
        $stmt = $pdo->prepare(
            'UPDATE users 
             SET vk_notifications_enabled = ?, 
                 vk_profile_url = ?,
                 email_notifications_enabled = ?,
                 work_email = ?
             WHERE id = ?'
        );
        
        $stmt->execute([
            $vkEnabled,
            $vkProfile,
            $emailEnabled,
            $workEmail,
            $user['id']
        ]);
        
        respond(['message' => 'Settings updated successfully']);
        
    } catch (PDOException $e) {
        respond(['error' => 'Database error'], 500);
    }
}

respond(['error' => 'Method not allowed'], 405);