/*
  # Add 10 additional consumer products
  
  1. New Products Added
    - Adding 10 more consumer goods products to reach 20 total
    - Products include: flour, tomato, onion, potatoes, dates, milk, tea, coffee, spices, and butter
    - Each with appropriate icons, colors, and reference prices
    - Display order continues from existing products (11-20)
*/

INSERT INTO products (name, icon, color, reference_price, display_order) VALUES
  ('دقيق قمح', 'fa-wheat', '#8B4513', 8.50, 11),
  ('طماطم طازة', 'fa-tomato', '#E63946', 5.00, 12),
  ('بصل', 'fa-bulb', '#FFD60A', 3.50, 13),
  ('بطاطا', 'fa-potato', '#A0522D', 4.00, 14),
  ('تمر', 'fa-calendar', '#8B4513', 55.00, 15),
  ('حليب طازج', 'fa-glass', '#FFF', 7.50, 16),
  ('شاي أسود', 'fa-leaf', '#3D2817', 45.00, 17),
  ('قهوة', 'fa-mug-hot', '#6F4E37', 60.00, 18),
  ('ملح', 'fa-shaker', '#C0C0C0', 2.00, 19),
  ('زبدة', 'fa-cow', '#FFD700', 32.00, 20);
