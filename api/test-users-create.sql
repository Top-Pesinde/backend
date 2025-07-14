-- Test kullanıcıları oluşturma SQL
-- Password hash: 123456 için bcrypt hash
-- $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi

INSERT INTO users (
    id, 
    first_name, 
    last_name, 
    username, 
    email, 
    password, 
    phone, 
    location, 
    bio, 
    profile_photo, 
    role, 
    status, 
    created_at, 
    updated_at
) VALUES 
(
    'test_user_1', 
    'Test', 
    'User One', 
    'testuser', 
    'testuser@example.com', 
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
    '+905551234567', 
    'Istanbul, Turkey', 
    'Test kullanıcısı 1', 
    null, 
    'USER', 
    true, 
    NOW(), 
    NOW()
),
(
    'test_user_2', 
    'Test', 
    'User Two', 
    'testuser2', 
    'testuser2@example.com', 
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
    '+905551234568', 
    'Ankara, Turkey', 
    'Test kullanıcısı 2', 
    null, 
    'USER', 
    true, 
    NOW(), 
    NOW()
)
ON CONFLICT (username) DO NOTHING;