<?php
/**
 * Kuapa Kokoo Daily Purchase Records System - Native PHP REST API
 * Zero-configuration PHP backend for cPanel shared hosting.
 */

// 1. CORS Headers - Allow cross-origin requests from React Web & Expo Mobile
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRFToken, Accept, Origin");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 2. Database Connection (Auto-creates SQLite database on first request)
$dbPath = __DIR__ . '/database.sqlite';
try {
    $pdo = new PDO("sqlite:" . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection error: " . $e->getMessage()]);
    exit();
}

// 3. Database Schema Initialization & Seeding
function init_database($pdo) {
    // Users Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        email TEXT,
        is_superuser INTEGER DEFAULT 0,
        is_staff INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        assigned_societies TEXT DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // Regions Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS regions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        region_name TEXT UNIQUE NOT NULL
    )");

    // Districts Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS districts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        district_name TEXT UNIQUE NOT NULL,
        region_id INTEGER,
        location TEXT
    )");

    // Zones Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS zones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        zone_name TEXT NOT NULL,
        station_mark TEXT,
        district_id INTEGER,
        status TEXT DEFAULT 'Active'
    )");

    // Seasons Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS seasons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        season_name TEXT NOT NULL,
        start_at DATE,
        end_at DATE,
        is_active INTEGER DEFAULT 1
    )");

    // Farmers Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS farmers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        cocobod_id TEXT UNIQUE,
        kk_id_num TEXT UNIQUE,
        phone_number TEXT,
        gender TEXT DEFAULT 'Male',
        society TEXT,
        district_society_id INTEGER,
        zone_id INTEGER,
        field_size REAL DEFAULT 2.5,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // Farms Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS farms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        farmer_id INTEGER NOT NULL,
        district_society_id INTEGER,
        zone_id INTEGER,
        coordinates TEXT,
        farm_size_ha REAL DEFAULT 2.5,
        polygon TEXT DEFAULT '[]',
        status TEXT DEFAULT 'Active',
        estimated_yield_kg REAL DEFAULT 1125.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // Deliveries Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS deliveries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        farmer_id INTEGER NOT NULL,
        farm_id INTEGER,
        season_id INTEGER,
        delivery_date DATE NOT NULL,
        volume_delivered_kilos REAL NOT NULL,
        volume_delivered_bags REAL NOT NULL,
        amount_ghc REAL NOT NULL,
        DPR_serial_number TEXT,
        waybill_number TEXT,
        created_by_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // Purchase Sessions & Records Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS purchase_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id TEXT UNIQUE,
        officer_name TEXT,
        dprs_number TEXT,
        waybill_no TEXT,
        cocoa_season TEXT,
        society TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS purchase_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER,
        date DATE,
        farmer_name TEXT,
        kk_id TEXT,
        kilos REAL,
        bags REAL,
        gross_amount REAL,
        net_amount REAL,
        bonus REAL
    )");

    // Seed Default Admin Users if table is empty
    $stmt = $pdo->query("SELECT COUNT(*) FROM users");
    if ($stmt->fetchColumn() == 0) {
        $hash1 = password_hash("Admin@2026!", PASSWORD_BCRYPT);
        $hash2 = password_hash("admin123", PASSWORD_BCRYPT);

        $insert = $pdo->prepare("INSERT INTO users (username, password_hash, email, is_superuser, is_staff) VALUES (?, ?, ?, 1, 1)");
        $insert->execute(["admin", $hash1, "admin@cyhoracorelab.com"]);
        $insert->execute(["admin123", $hash2, "admin123@cyhoracorelab.com"]);

        // Seed Sample Regions
        $pdo->exec("INSERT INTO regions (region_name) VALUES ('Ashanti'), ('Western North'), ('Ahafo'), ('Eastern')");

        // Seed Sample Districts
        $pdo->exec("INSERT INTO districts (district_name, region_id, location) VALUES 
            ('Offinso District Society', 1, 'Offinso Depot'),
            ('Goaso District Society', 3, 'Goaso Main Depot'),
            ('Sefwi Wiawso District Society', 2, 'Sefwi Depot')");

        // Seed Sample Zones
        $pdo->exec("INSERT INTO zones (zone_name, station_mark, district_id) VALUES 
            ('Offinso Central Zone', 'OFF-01', 1),
            ('Goaso Main Zone', 'GOA-01', 2),
            ('Sefwi North Zone', 'SEF-01', 3)");

        // Seed Sample Season
        $pdo->exec("INSERT INTO seasons (season_name, start_at, is_active) VALUES ('2025/2026 Main Crop', '2025-10-01', 1)");

        // Seed Sample Farmer & Farm
        $pdo->exec("INSERT INTO farmers (name, cocobod_id, kk_id_num, phone_number, gender, society, district_society_id, zone_id, field_size) VALUES 
            ('Kwame Mensah', 'KK-100234', 'KK-ID-8821', '+233 24 123 4567', 'Male', 'Offinso Central', 1, 1, 3.5),
            ('Ama Serwaa', 'KK-100235', 'KK-ID-8822', '+233 20 987 6543', 'Female', 'Goaso Main', 2, 2, 2.0)");

        $pdo->exec("INSERT INTO farms (farmer_id, district_society_id, zone_id, coordinates, farm_size_ha, estimated_yield_kg) VALUES 
            (1, 1, 1, '6.7333, -1.6500', 3.5, 1575.0),
            (2, 2, 2, '6.8000, -2.5000', 2.0, 900.0)");

        // Seed Sample Deliveries
        $pdo->exec("INSERT INTO deliveries (farmer_id, farm_id, season_id, delivery_date, volume_delivered_kilos, volume_delivered_bags, amount_ghc, DPR_serial_number, waybill_number, created_by_id) VALUES 
            (1, 1, 1, '2026-03-15', 625.0, 10.0, 20833.33, 'DPR-9901', 'WAY-4401', 1),
            (2, 2, 1, '2026-03-18', 312.5, 5.0, 10416.66, 'DPR-9902', 'WAY-4402', 1)");
    }
}

init_database($pdo);

// 4. Simple JWT Helper (Base64Url Token Generator & Validator)
function generate_jwt($payload_data) {
    $secret = "kuapa-kokoo-jwt-secret-key-2026";
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode(array_merge([
        'iat' => time(),
        'exp' => time() + (365 * 24 * 60 * 60) // 1 year expiry
    ], $payload_data));

    $b64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $b64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    $signature = hash_hmac('sha256', $b64Header . "." . $b64Payload, $secret, true);
    $b64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

    return $b64Header . "." . $b64Payload . "." . $b64Signature;
}

// 5. Request Router & Dispatcher
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

// Normalize path (strip /api or index.php prefix if present)
$path = preg_replace('#^/+(index\.php/)?(api/)?#', '', $uri);
$path = rtrim($path, '/');

// --- ROUTE HANDLERS ---

// Health check endpoint (Bare root domain or /api/)
if ($path === '' || $path === 'api') {
    echo json_encode([
        "status" => "online",
        "name" => "Kuapa Kokoo Daily Purchase API (PHP Native)",
        "version" => "1.0.0"
    ]);
    exit();
}

// Authentication Endpoint (Token Obtain)
if ($path === 'token' || $path === 'token/') {
    $username = trim($input['username'] ?? '');
    $password = trim($input['password'] ?? '');

    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        $token = generate_jwt(['user_id' => $user['id'], 'username' => $user['username']]);
        echo json_encode([
            "access" => $token,
            "refresh" => $token,
            "user" => [
                "id" => $user['id'],
                "username" => $user['username'],
                "email" => $user['email']
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode(["detail" => "No active account found with the given credentials"]);
    }
    exit();
}

// Token Refresh Endpoint
if ($path === 'token/refresh' || $path === 'token/refresh/') {
    $newToken = generate_jwt(['refresh' => true]);
    echo json_encode(["access" => $newToken]);
    exit();
}

// Regions List
if ($path === 'regions') {
    $stmt = $pdo->query("SELECT r.*, (SELECT COUNT(*) FROM districts d WHERE d.region_id = r.id) as districts_count FROM regions r ORDER BY region_name");
    echo json_encode($stmt->fetchAll());
    exit();
}

// Districts List
if ($path === 'districts') {
    $stmt = $pdo->query("SELECT d.*, r.region_name, (SELECT COUNT(*) FROM zones z WHERE z.district_id = d.id) as zones_count 
                         FROM districts d LEFT JOIN regions r ON d.region_id = r.id ORDER BY district_name");
    echo json_encode($stmt->fetchAll());
    exit();
}

// Zones List
if ($path === 'zones') {
    $stmt = $pdo->query("SELECT z.*, d.district_name FROM zones z LEFT JOIN districts d ON z.district_id = d.id ORDER BY zone_name");
    echo json_encode($stmt->fetchAll());
    exit();
}

// Seasons List
if ($path === 'seasons') {
    $stmt = $pdo->query("SELECT * FROM seasons ORDER BY start_at DESC");
    echo json_encode($stmt->fetchAll());
    exit();
}

// Users List
if ($path === 'users') {
    $stmt = $pdo->query("SELECT id, username, email, is_superuser, is_staff, assigned_societies FROM users ORDER BY username");
    $users = $stmt->fetchAll();
    foreach ($users as &$u) {
        $u['assigned_societies'] = json_decode($u['assigned_societies'] ?? '[]', true);
    }
    echo json_encode($users);
    exit();
}

// Farmers Endpoints
if (strpos($path, 'farmers') === 0) {
    // Single Farmer Lifetime History: /farmers/{id}/lifetime_history
    if (preg_match('#^farmers/(\d+)/lifetime_history$#', $path, $matches)) {
        $farmerId = $matches[1];
        
        $stmtDeliv = $pdo->prepare("SELECT d.*, s.season_name, f.name as farmer_name, f.cocobod_id, dis.district_name
                                    FROM deliveries d 
                                    LEFT JOIN seasons s ON d.season_id = s.id
                                    LEFT JOIN farmers f ON d.farmer_id = f.id
                                    LEFT JOIN districts dis ON f.district_society_id = dis.id
                                    WHERE d.farmer_id = ? ORDER BY d.delivery_date DESC");
        $stmtDeliv->execute([$farmerId]);
        $deliveries = $stmtDeliv->fetchAll();

        $seasonsDict = [];
        $recordsList = [];

        foreach ($deliveries as $d) {
            $seasonStr = $d['season_name'] ?? '2025/2026';
            if (!isset($seasonsDict[$seasonStr])) {
                $seasonsDict[$seasonStr] = [
                    'season' => $seasonStr,
                    'kilos' => 0.0,
                    'bags' => 0.0,
                    'amount' => 0.0,
                    'bonus' => 0.0,
                    'count' => 0
                ];
            }

            $kilos = (float)$d['volume_delivered_kilos'];
            $bags = (float)$d['volume_delivered_bags'];
            $amount = (float)$d['amount_ghc'];
            $bonus = round($kilos * 1.12, 2);

            $seasonsDict[$seasonStr]['kilos'] += $kilos;
            $seasonsDict[$seasonStr]['bags'] = round($seasonsDict[$seasonStr]['kilos'] / 62.5, 2);
            $seasonsDict[$seasonStr]['amount'] += $amount;
            $seasonsDict[$seasonStr]['bonus'] = round($seasonsDict[$seasonStr]['kilos'] * 1.12, 2);
            $seasonsDict[$seasonStr]['count'] += 1;

            $recordsList[] = [
                'id' => "DEL-" . $d['id'],
                'date' => $d['delivery_date'],
                'session_id' => $d['id'],
                'waybill_no' => $d['waybill_number'] ?? '—',
                'season' => $seasonStr,
                'society' => $d['district_name'] ?? 'Offinso Central',
                'kilos' => $kilos,
                'bags' => $bags,
                'amount_ghc' => $amount,
                'bonus_ghc' => $bonus
            ];
        }

        echo json_encode([
            "seasons_summary" => array_values($seasonsDict),
            "records" => $recordsList
        ]);
        exit();
    }

    // List / Create Farmers
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT f.*, d.district_name, z.zone_name as zone_name_str,
                             (SELECT COUNT(*) FROM farms fm WHERE fm.farmer_id = f.id) as farms_count
                             FROM farmers f 
                             LEFT JOIN districts d ON f.district_society_id = d.id
                             LEFT JOIN zones z ON f.zone_id = z.id ORDER BY f.name");
        echo json_encode($stmt->fetchAll());
        exit();
    }

    if ($method === 'POST') {
        $name = $input['name'] ?? 'New Farmer';
        $cocobod_id = $input['cocobod_id'] ?? ('KK-' . rand(10000, 99999));
        $phone = $input['phone_number'] ?? '';
        $gender = $input['gender'] ?? 'Male';
        $society = $input['society'] ?? '';

        $stmt = $pdo->prepare("INSERT INTO farmers (name, cocobod_id, phone_number, gender, society) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$name, $cocobod_id, $phone, $gender, $society]);
        $id = $pdo->lastInsertId();

        $stmtGet = $pdo->prepare("SELECT * FROM farmers WHERE id = ?");
        $stmtGet->execute([$id]);
        echo json_encode($stmtGet->fetch());
        exit();
    }
}

// Farms List & Create
if (strpos($path, 'farms') === 0) {
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT fm.*, f.name as farmer_name, f.cocobod_id 
                             FROM farms fm LEFT JOIN farmers f ON fm.farmer_id = f.id ORDER BY fm.created_at DESC");
        $farms = $stmt->fetchAll();
        foreach ($farms as &$fm) {
            $fm['polygon'] = json_decode($fm['polygon'] ?? '[]', true);
        }
        echo json_encode($farms);
        exit();
    }

    if ($method === 'POST') {
        $farmer_id = $input['farmer_id'] ?? 1;
        $coordinates = $input['coordinates'] ?? '6.7333, -1.6500';
        $size = $input['farm_size_ha'] ?? 2.5;
        $polygon = json_encode($input['polygon'] ?? []);

        $stmt = $pdo->prepare("INSERT INTO farms (farmer_id, coordinates, farm_size_ha, polygon) VALUES (?, ?, ?, ?)");
        $stmt->execute([$farmer_id, $coordinates, $size, $polygon]);
        $id = $pdo->lastInsertId();

        $stmtGet = $pdo->prepare("SELECT * FROM farms WHERE id = ?");
        $stmtGet->execute([$id]);
        $res = $stmtGet->fetch();
        $res['polygon'] = json_decode($res['polygon'], true);
        echo json_encode($res);
        exit();
    }
}

// Sessions List & Create
if (strpos($path, 'sessions') === 0) {
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT * FROM purchase_sessions ORDER BY created_at DESC");
        $sessions = $stmt->fetchAll();
        foreach ($sessions as &$sess) {
            $stmtRec = $pdo->prepare("SELECT * FROM purchase_records WHERE session_id = ?");
            $stmtRec->execute([$sess['id']]);
            $recs = $stmtRec->fetchAll();
            $sess['records'] = $recs;
            
            $totK = 0.0; $totB = 0.0; $totA = 0.0;
            foreach ($recs as $r) {
                $totK += (float)($r['kilos'] ?? 0);
                $totB += (float)($r['bags'] ?? 0);
                $totA += (float)($r['net_amount'] ?? 0);
            }
            $sess['total_kilos'] = $totK;
            $sess['total_bags'] = $totB;
            $sess['total_amount'] = $totA;
        }
        echo json_encode($sessions);
        exit();
    }

    if ($method === 'POST') {
        $client_id = $input['client_id'] ?? ('CLIENT-' . uniqid());
        $officer = $input['officer_name'] ?? 'Field Officer';
        $dprs = $input['dprs_number'] ?? ('DPR-' . rand(1000, 9999));
        $waybill = $input['waybill_no'] ?? ('WAY-' . rand(1000, 9999));
        $season = $input['cocoa_season'] ?? '2025/2026';
        $society = $input['society'] ?? 'Offinso Central';
        $recordsData = $input['records'] ?? [];

        $stmt = $pdo->prepare("INSERT INTO purchase_sessions (client_id, officer_name, dprs_number, waybill_no, cocoa_season, society) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$client_id, $officer, $dprs, $waybill, $season, $society]);
        $sessionId = $pdo->lastInsertId();

        foreach ($recordsData as $rec) {
            $rStmt = $pdo->prepare("INSERT INTO purchase_records (session_id, date, farmer_name, kk_id, kilos, bags, gross_amount, net_amount, bonus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $rStmt->execute([
                $sessionId,
                $rec['date'] ?? date('Y-m-d'),
                $rec['farmer_name'] ?? 'Farmer',
                $rec['kk_id'] ?? 'KK-001',
                $rec['kilos'] ?? 62.5,
                $rec['bags'] ?? 1.0,
                $rec['gross_amount'] ?? 2083.33,
                $rec['net_amount'] ?? 2083.33,
                $rec['bonus'] ?? 70.0
            ]);
        }

        $stmtGet = $pdo->prepare("SELECT * FROM purchase_sessions WHERE id = ?");
        $stmtGet->execute([$sessionId]);
        $sessObj = $stmtGet->fetch();
        $sessObj['records'] = $recordsData;
        echo json_encode($sessObj);
        exit();
    }
}

// Records List
if (strpos($path, 'records') === 0) {
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT * FROM purchase_records ORDER BY date DESC");
        echo json_encode($stmt->fetchAll());
        exit();
    }
}

// Officer Societies List
if (strpos($path, 'officer-societies') === 0) {
    echo json_encode([]);
    exit();
}

// Delivery Updates List
if (strpos($path, 'delivery-updates') === 0) {
    echo json_encode([]);
    exit();
}

// Deliveries & Purchases List & Create
if (strpos($path, 'deliveries') === 0 || strpos($path, 'purchases') === 0) {
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT d.*, f.name as farmer_name, f.cocobod_id, s.season_name, 'System' as created_by_user
                             FROM deliveries d 
                             LEFT JOIN farmers f ON d.farmer_id = f.id 
                             LEFT JOIN seasons s ON d.season_id = s.id 
                             ORDER BY d.delivery_date DESC");
        echo json_encode($stmt->fetchAll());
        exit();
    }

    if ($method === 'POST') {
        $farmer_id = $input['farmer_id'] ?? 1;
        $kilos = (float)($input['volume_delivered_kilos'] ?? 62.5);
        $bags = round($kilos / 62.5, 2);
        $amount = round($kilos * 33.33, 2);
        $date = $input['delivery_date'] ?? date('Y-m-d');
        $dpr = $input['DPR_serial_number'] ?? ('DPR-' . rand(1000, 9999));
        $waybill = $input['waybill_number'] ?? ('WAY-' . rand(1000, 9999));

        $stmt = $pdo->prepare("INSERT INTO deliveries (farmer_id, delivery_date, volume_delivered_kilos, volume_delivered_bags, amount_ghc, DPR_serial_number, waybill_number) 
                               VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$farmer_id, $date, $kilos, $bags, $amount, $dpr, $waybill]);
        $id = $pdo->lastInsertId();

        $stmtGet = $pdo->prepare("SELECT d.*, f.name as farmer_name, f.cocobod_id FROM deliveries d LEFT JOIN farmers f ON d.farmer_id = f.id WHERE d.id = ?");
        $stmtGet->execute([$id]);
        echo json_encode($stmtGet->fetch());
        exit();
    }
}

// Fallback 404 handler for unknown routes
http_response_code(404);
echo json_encode(["detail" => "Endpoint not found: " . $path]);

