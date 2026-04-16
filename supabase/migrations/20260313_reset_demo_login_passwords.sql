-- Align demo accounts with the login UI.
-- Demo password: password123

update public.users
set
    password = '$2b$10$hN0lo4ms3CHEObI/izYMfO//Crq7NdeZNoDeaxn3Ytd8fMD6LRGAe',
    "isActive" = true
where email in (
    'director@vtn.vn',
    'pm@vtn.vn',
    'arch@vtn.vn',
    'finance@vtn.vn'
);
