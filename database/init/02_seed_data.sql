-- Seed-Daten für COMNet
-- Erstellt initiale Daten für Entwicklung und Testing

-- Standard-Netzwerk erstellen
INSERT INTO networks (id, name, display_name, description, domain, is_public, is_federated) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'comnet-main',
    'COMNet Hauptnetzwerk',
    'Das Hauptnetzwerk von COMNet - einer dezentralen Social-Media-Plattform',
    'localhost:8765',
    true,
    true
);

-- Admin-Benutzer erstellen (Passwort: admin123)
INSERT INTO users (id, username, email, password_hash, display_name, bio, is_verified, network_id)
VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'admin',
    'admin@comnet.local',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin123
    'System Administrator',
    'Administrator des COMNet Hauptnetzwerks',
    true,
    '550e8400-e29b-41d4-a716-446655440000'
);

-- Netzwerk-Admin zuweisen
UPDATE networks SET admin_user_id = '550e8400-e29b-41d4-a716-446655440001' 
WHERE id = '550e8400-e29b-41d4-a716-446655440000';

-- Demo-Benutzer erstellen
INSERT INTO users (id, username, email, password_hash, display_name, bio, network_id)
VALUES 
(
    '550e8400-e29b-41d4-a716-446655440002',
    'alice',
    'alice@comnet.local',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin123
    'Alice Schmidt',
    'Entwicklerin und Open Source Enthusiastin',
    '550e8400-e29b-41d4-a716-446655440000'
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    'bob',
    'bob@comnet.local',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin123
    'Bob Müller',
    'Tech-Blogger und Community Manager',
    '550e8400-e29b-41d4-a716-446655440000'
);

-- Demo-Communities erstellen
INSERT INTO communities (id, name, display_name, description, rules, is_public, creator_id, network_id)
VALUES 
(
    '550e8400-e29b-41d4-a716-446655440010',
    'allgemein',
    'Allgemein',
    'Allgemeine Diskussionen und Neuigkeiten',
    'Bitte respektvoll miteinander umgehen. Keine Spam oder unangemessene Inhalte.',
    true,
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440000'
),
(
    '550e8400-e29b-41d4-a716-446655440011',
    'technologie',
    'Technologie',
    'Diskussionen über Technologie, Programmierung und Innovation',
    'Technische Diskussionen sind willkommen. Bitte Code-Beispiele in Code-Blöcken formatieren.',
    true,
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440000'
),
(
    '550e8400-e29b-41d4-a716-446655440012',
    'dezentralisierung',
    'Dezentralisierung',
    'Diskussionen über dezentrale Technologien und Föderation',
    'Fokus auf dezentrale Systeme, Blockchain, ActivityPub und ähnliche Technologien.',
    true,
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440000'
);

-- Community-Mitgliedschaften
INSERT INTO community_members (user_id, community_id, role)
VALUES 
-- Admin ist in allen Communities
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440010', 'admin'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', 'admin'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440012', 'admin'),
-- Alice ist in Technologie und Dezentralisierung
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440010', 'member'),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440011', 'moderator'),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440012', 'member'),
-- Bob ist in allen Communities
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440010', 'member'),
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440011', 'member'),
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440012', 'moderator');

-- Demo-Posts erstellen
INSERT INTO posts (id, title, content, author_id, community_id, network_id, upvotes, downvotes, score)
VALUES 
(
    '550e8400-e29b-41d4-a716-446655440020',
    'Willkommen bei COMNet!',
    'Willkommen in der dezentralen Social-Media-Plattform COMNet! Hier können Sie Communities erstellen, Beiträge verfassen und sich mit anderen Nutzern vernetzen. Das Besondere an COMNet ist die dezentrale Architektur - jeder kann sein eigenes Netzwerk hosten und trotzdem mit anderen vernetzt bleiben.',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440010',
    '550e8400-e29b-41d4-a716-446655440000',
    15,
    0,
    15
),
(
    '550e8400-e29b-41d4-a716-446655440021',
    'Node.js vs Rust für Backend-Entwicklung',
    'Ich frage mich, welche Sprache besser für ein dezentrales Social-Media-Backend geeignet ist. Node.js hat den Vorteil der schnellen Entwicklung und des großen Ökosystems, während Rust bessere Performance und Speichersicherheit bietet. Was denkt ihr?',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440011',
    '550e8400-e29b-41d4-a716-446655440000',
    8,
    1,
    7
),
(
    '550e8400-e29b-41d4-a716-446655440022',
    'ActivityPub vs eigenes Föderations-Protokoll',
    'Für COMNet überlegen wir, ob wir ActivityPub verwenden oder ein eigenes, leichtes Föderations-Protokoll entwickeln sollen. ActivityPub ist etabliert, aber komplex. Ein eigenes Protokoll könnte einfacher sein, aber weniger interoperabel. Eure Meinung?',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440012',
    '550e8400-e29b-41d4-a716-446655440000',
    12,
    2,
    10
);

-- Demo-Kommentare
INSERT INTO comments (id, content, author_id, post_id, upvotes, downvotes, score)
VALUES 
(
    '550e8400-e29b-41d4-a716-446655440030',
    'Großartig! Ich freue mich darauf, mehr über die Föderation zu lernen.',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440020',
    3,
    0,
    3
),
(
    '550e8400-e29b-41d4-a716-446655440031',
    'Rust ist definitiv die bessere Wahl für Performance-kritische Anwendungen!',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440021',
    5,
    0,
    5
),
(
    '550e8400-e29b-41d4-a716-446655440032',
    'Ich denke, wir sollten mit ActivityPub beginnen und es bei Bedarf anpassen.',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440022',
    4,
    0,
    4
);

-- Kommentar-Zählung aktualisieren
UPDATE posts SET comment_count = 1 WHERE id = '550e8400-e29b-41d4-a716-446655440020';
UPDATE posts SET comment_count = 1 WHERE id = '550e8400-e29b-41d4-a716-446655440021';
UPDATE posts SET comment_count = 1 WHERE id = '550e8400-e29b-41d4-a716-446655440022';
