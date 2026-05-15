<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

function respond($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function get_user_from_token($pdo) {
    $auth = '';
    
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        $auth = $headers['Authorization'] 
             ?? $headers['authorization'] 
             ?? $headers['AUTHORIZATION'] 
             ?? '';
    }
    
    if (!$auth) {
        $auth = $_SERVER['HTTP_AUTHORIZATION'] 
             ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] 
             ?? '';
    }

    if (!$auth || !str_starts_with($auth, 'Bearer ')) {
        respond(['error' => 'Unauthorized', 'debug' => 'no auth header'], 401);
    }
    
    $token = substr($auth, 7);
    
    // 🔥 Ищем и по auth_token, и по vk_token
    $stmt = $pdo->prepare('SELECT * FROM users WHERE auth_token = ? OR vk_token = ?');
    $stmt->execute([$token, $token]);
    
    $user = $stmt->fetch();
    if (!$user) respond(['error' => 'Unauthorized', 'debug' => 'user not found'], 401);
    return $user;
}

function get_body() {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}