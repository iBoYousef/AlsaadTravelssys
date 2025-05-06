-- إضافة موظف تجريبي جديد
INSERT INTO public.employees (
  id, name, email, phone, role, active, join_date, password
) VALUES (
  '1005',
  'أحمد خالد المطيري',
  'ahmad@alsaad.travel',
  '96599123461',
  'agent',
  true,
  '2024-02-22',
  'pass1005'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  active = EXCLUDED.active,
  join_date = EXCLUDED.join_date,
  password = EXCLUDED.password;