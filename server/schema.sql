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

-- Seed the booking portfolio as editable draft products. Draft status prevents
-- unpriced defaults from appearing in the public store.
WITH booking_products(id,title,slug,description,category) AS (
  VALUES
    ('10000000-0000-4000-8000-000000000001'::uuid,'Signature Nude Set','signature-nude-set','A refined nude manicure from the DE_JOY booking portfolio.','Signature sets'),
    ('10000000-0000-4000-8000-000000000002'::uuid,'Soft Pink Glow','soft-pink-glow','A soft pink, high-gloss manicure from the DE_JOY booking portfolio.','Signature sets'),
    ('10000000-0000-4000-8000-000000000003'::uuid,'Classic French Detail','classic-french-detail','A clean French-inspired finish from the DE_JOY booking portfolio.','Nail artistry'),
    ('10000000-0000-4000-8000-000000000004'::uuid,'Sculpted Editorial Set','sculpted-editorial-set','An editorial sculpted nail look from the DE_JOY booking portfolio.','Nail artistry'),
    ('10000000-0000-4000-8000-000000000005'::uuid,'Everyday Gloss Set','everyday-gloss-set','A wearable glossy set from the DE_JOY booking portfolio.','Signature sets'),
    ('10000000-0000-4000-8000-000000000006'::uuid,'Statement Finish','statement-finish','A statement manicure from the DE_JOY booking portfolio.','Nail artistry'),
    ('10000000-0000-4000-8000-000000000007'::uuid,'Luxury Booking Experience','luxury-booking-experience','The signature DE_JOY booking campaign image.','Booking portfolio')
)
INSERT INTO products (id,title,slug,description,price_minor,inventory,status,category,featured)
SELECT id,title,slug,description,0,0,'draft',category,false FROM booking_products
ON CONFLICT DO NOTHING;

WITH booking_images(id,product_id,url,alt_text) AS (
  VALUES
    ('20000000-0000-4000-8000-000000000001'::uuid,'10000000-0000-4000-8000-000000000001'::uuid,'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1200&q=88','Signature nude manicure'),
    ('20000000-0000-4000-8000-000000000002'::uuid,'10000000-0000-4000-8000-000000000002'::uuid,'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=1000&q=84','Soft pink manicure'),
    ('20000000-0000-4000-8000-000000000003'::uuid,'10000000-0000-4000-8000-000000000003'::uuid,'https://images.unsplash.com/photo-1604902396830-aca29e19b067?auto=format&fit=crop&w=1000&q=84','Classic detailed manicure'),
    ('20000000-0000-4000-8000-000000000004'::uuid,'10000000-0000-4000-8000-000000000004'::uuid,'https://images.unsplash.com/photo-1610992015732-2449b76344bc?auto=format&fit=crop&w=1000&q=84','Sculpted editorial nails'),
    ('20000000-0000-4000-8000-000000000005'::uuid,'10000000-0000-4000-8000-000000000005'::uuid,'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=1000&q=84','Everyday glossy manicure'),
    ('20000000-0000-4000-8000-000000000006'::uuid,'10000000-0000-4000-8000-000000000006'::uuid,'https://images.unsplash.com/photo-1619451334792-150fd785ee74?auto=format&fit=crop&w=1000&q=84','Statement manicure'),
    ('20000000-0000-4000-8000-000000000007'::uuid,'10000000-0000-4000-8000-000000000007'::uuid,'https://images.pexels.com/photos/16363470/pexels-photo-16363470.jpeg?auto=compress&cs=tinysrgb&w=1600','Luxury DE_JOY booking experience')
)
INSERT INTO product_images (id,product_id,url,alt_text,position)
SELECT i.id,i.product_id,i.url,i.alt_text,0 FROM booking_images i
JOIN products p ON p.id=i.product_id
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id, position);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON admin_sessions(token_hash);
