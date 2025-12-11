-- Activate the admin user
UPDATE user_profiles
SET is_active = true
WHERE email = 'admin@testing.test';

-- Verify the update
SELECT email, role, is_active
FROM user_profiles
WHERE email = 'admin@testing.test';
