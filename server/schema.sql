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

-- Seed the booking portfolio as editable starter products with placeholder pricing.
WITH booking_products(id,title,slug,description,category,price_minor) AS (
  VALUES
    ('10000000-0000-4000-8000-000000000001'::uuid,'Barely Blush Almond','barely-blush-almond','A refined blush nude almond manicure with an immaculate glossy finish.','Nude & neutral',1500000),
    ('10000000-0000-4000-8000-000000000002'::uuid,'Rose Quartz Glow','rose-quartz-glow','A soft translucent pink manicure inspired by polished rose quartz.','Pink edit',1800000),
    ('10000000-0000-4000-8000-000000000003'::uuid,'Modern French Muse','modern-french-muse','A clean contemporary French manicure with precise statement tips.','French tips',2000000),
    ('10000000-0000-4000-8000-000000000004'::uuid,'Sculpted Mocha Luxe','sculpted-mocha-luxe','A sculpted editorial set in warm mocha and neutral tones.','Sculpted sets',2500000),
    ('10000000-0000-4000-8000-000000000005'::uuid,'Everyday Nude Gloss','everyday-nude-gloss','A versatile glossy nude set designed for effortless everyday wear.','Nude & neutral',1400000),
    ('10000000-0000-4000-8000-000000000006'::uuid,'After Dark Statement','after-dark-statement','A confident statement manicure created for evenings and special moments.','Statement nails',2200000),
    ('10000000-0000-4000-8000-000000000007'::uuid,'Bridal Pearl Signature','bridal-pearl-signature','An elegant pearl-toned signature set for bridal and luxury occasions.','Occasion nails',2800000)
)
INSERT INTO products (id,title,slug,description,price_minor,inventory,status,category,featured)
SELECT id,title,slug,description,price_minor,12,'active',category,false FROM booking_products
ON CONFLICT DO NOTHING;

WITH booking_images(id,product_id,url,alt_text) AS (
  VALUES
    ('20000000-0000-4000-8000-000000000001'::uuid,'10000000-0000-4000-8000-000000000001'::uuid,'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1200&q=88','Barely Blush Almond nail set'),
    ('20000000-0000-4000-8000-000000000002'::uuid,'10000000-0000-4000-8000-000000000002'::uuid,'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=1000&q=84','Rose Quartz Glow nail set'),
    ('20000000-0000-4000-8000-000000000003'::uuid,'10000000-0000-4000-8000-000000000003'::uuid,'https://images.unsplash.com/photo-1604902396830-aca29e19b067?auto=format&fit=crop&w=1000&q=84','Modern French Muse nail set'),
    ('20000000-0000-4000-8000-000000000004'::uuid,'10000000-0000-4000-8000-000000000004'::uuid,'https://images.unsplash.com/photo-1610992015732-2449b76344bc?auto=format&fit=crop&w=1000&q=84','Sculpted Mocha Luxe nail set'),
    ('20000000-0000-4000-8000-000000000005'::uuid,'10000000-0000-4000-8000-000000000005'::uuid,'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=1000&q=84','Everyday Nude Gloss nail set'),
    ('20000000-0000-4000-8000-000000000006'::uuid,'10000000-0000-4000-8000-000000000006'::uuid,'https://images.unsplash.com/photo-1619451334792-150fd785ee74?auto=format&fit=crop&w=1000&q=84','After Dark Statement nail set'),
    ('20000000-0000-4000-8000-000000000007'::uuid,'10000000-0000-4000-8000-000000000007'::uuid,'https://images.pexels.com/photos/16363470/pexels-photo-16363470.jpeg?auto=compress&cs=tinysrgb&w=1600','Bridal Pearl Signature nail set')
)
INSERT INTO product_images (id,product_id,url,alt_text,position)
SELECT i.id,i.product_id,i.url,i.alt_text,0 FROM booking_images i
JOIN products p ON p.id=i.product_id
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id, position);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON admin_sessions(token_hash);
