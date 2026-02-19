-- Insert initial users for Phase 9
INSERT INTO users (username, password_hash) VALUES 
('Meet', 'c8f16ace244443e4fdb6bdf6579ad1d289aee6d7a4b2c71aada4a1a8c2b28cd0'),
('Pruthvish', 'ec94d32afe0f47c30280950ef2978be2384b79bdf6932f2094f561bc12bdd366'),
('Hetvi', '45503f207e3272614dd1036483faf507c97e7eb0920f66ea25822c04fff3a05d')
ON CONFLICT (username) DO NOTHING;
