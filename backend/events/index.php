<?php
require_once '../db.php';
require_once '../helpers.php';

$user   = get_user_from_token($pdo);
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $search   = $_GET['search']      ?? '';
    $category = $_GET['category_id'] ?? '';

    $sql = 'SELECT e.*, c.name as category_name
            FROM events e
            JOIN categories c ON e.category_id = c.id
            WHERE e.user_id = ?';
    $params = [$user['id']];

    if ($search)   { $sql .= ' AND e.title LIKE ?';       $params[] = "%$search%"; }
    if ($category) { $sql .= ' AND e.category_id = ?';   $params[] = $category; }
    $sql .= ' ORDER BY e.start_datetime ASC';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    respond($stmt->fetchAll());
}

if ($method === 'POST') {
    $b     = get_body();
    $title = trim($b['title']          ?? '');
    $desc  = trim($b['description']    ?? '');
    $cat   = (int)($b['category_id']   ?? 0);
    $start =       $b['start_datetime'] ?? '';
    $end   = $b['end_datetime'] ?? $start;

    if (!$title || !$cat || !$start)
        respond(['error' => 'Заполните обязательные поля'], 422);

    try {
        $stmt = $pdo->prepare(
            'INSERT INTO events
             (user_id,category_id,title,description,location,start_datetime,end_datetime)
             VALUES (?,?,?,?,?,?,?)'
        );
        $stmt->execute([
            $user['id'], $cat, $title, $desc,
            trim($b['location'] ?? ''),
            $start, $end
        ]);
        $id = $pdo->lastInsertId();

        $day  = date('Y-m-d H:i:s', strtotime($start) - 86400);
        $hour = date('Y-m-d H:i:s', strtotime($start) - 3600);
        $ns = $pdo->prepare(
            'INSERT INTO notifications (event_id,user_id,notify_at,type) VALUES (?,?,?,?)'
        );
        $ns->execute([$id, $user['id'], $day,  'day_before']);
        $ns->execute([$id, $user['id'], $hour, 'hour_before']);

        respond(['id' => $id, 'message' => 'Мероприятие создано'], 201);

    } catch (PDOException $e) {
        respond(['error' => 'DB error', 'message' => $e->getMessage()], 500);
    }
}

respond(['error' => 'Method not allowed'], 405);