CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  display_name text NOT NULL DEFAULT 'Store Admin',
  role text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id uuid PRIMARY KEY,
  admin_id uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  price_minor integer NOT NULL CHECK (price_minor >= 0),
  compare_at_minor integer CHECK (compare_at_minor IS NULL OR compare_at_minor >= 0),
  currency char(3) NOT NULL DEFAULT 'NGN',
  inventory integer NOT NULL DEFAULT 0 CHECK (inventory >= 0),
  track_inventory boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  category text NOT NULL DEFAULT 'Nail care',
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt_text text NOT NULL DEFAULT '',
  position integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS store_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY,
  order_number bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  delivery_address text NOT NULL,
  customer_notes text NOT NULL DEFAULT '',
  subtotal_minor integer NOT NULL,
  total_minor integer NOT NULL,
  currency char(3) NOT NULL DEFAULT 'NGN',
  payment_method text NOT NULL DEFAULT 'offline',
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  fulfillment_status text NOT NULL DEFAULT 'unfulfilled' CHECK (fulfillment_status IN ('unfulfilled', 'processing', 'fulfilled', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  title text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price_minor integer NOT NULL CHECK (unit_price_minor >= 0),
  line_total_minor integer NOT NULL CHECK (line_total_minor >= 0)
);

INSERT INTO store_settings (key, value) VALUES
  ('store', '{"name":"DE_JOY ARTISTRY Store","currency":"NGN","announcement":"Shop nail essentials and custom sets.","offlineInstructions":"After placing your order, contact Joy on WhatsApp to receive payment and fulfillment instructions."}'::jsonb),
  ('contact', '{"whatsapp":"2347087777511","email":""}'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id, position);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON admin_sessions(token_hash);
