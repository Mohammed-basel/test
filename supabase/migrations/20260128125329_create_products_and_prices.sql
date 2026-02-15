/*
  # إنشاء جداول المنتجات والأسعار الأسبوعية

  1. جداول جديدة
    - `products` - بيانات المنتجات الأساسية
      - `id` (uuid, primary key)
      - `name` (text) - اسم المنتج
      - `icon` (text) - أيقونة Font Awesome
      - `color` (text) - لون المنتج
      - `reference_price` (numeric) - السعر الإرشادي
      - `display_order` (integer) - ترتيب العرض
      - `created_at` (timestamp)
    
    - `weekly_prices` - الأسعار الأسبوعية
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key)
      - `week_number` (integer) - رقم الأسبوع (1-4)
      - `price` (numeric) - السعر
      - `created_at` (timestamp)

  2. الأمان
    - تفعيل RLS على كل الجداول
    - السماح بالقراءة للجميع (بيانات عامة)
*/

-- إنشاء جدول المنتجات
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text NOT NULL DEFAULT 'fa-box',
  color text NOT NULL DEFAULT '#0056b3',
  reference_price numeric(10,2) NOT NULL DEFAULT 0,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- إنشاء جدول الأسعار الأسبوعية
CREATE TABLE IF NOT EXISTS weekly_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  week_number integer NOT NULL CHECK (week_number >= 1 AND week_number <= 4),
  price numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, week_number)
);

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_weekly_prices_product_id ON weekly_prices(product_id);
CREATE INDEX IF NOT EXISTS idx_weekly_prices_week_number ON weekly_prices(week_number);
CREATE INDEX IF NOT EXISTS idx_products_display_order ON products(display_order);

-- تفعيل RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_prices ENABLE ROW LEVEL SECURITY;

-- سياسات القراءة للجميع (بيانات عامة)
CREATE POLICY "Allow public read access to products"
  ON products
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public read access to weekly prices"
  ON weekly_prices
  FOR SELECT
  TO anon, authenticated
  USING (true);
