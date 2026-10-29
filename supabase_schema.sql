-- ecommerce_web/supabase_schema.sql
-- Supabase / PostgreSQL 15 schema based on Laravel migrations
-- Roles: admin | vendedor | cliente
-- Order number: ORD-YYYYMMDD-NNNN
-- QR payload: PAGO|{business_name}|{email}
-- Complaint status: enviada | en revisión | resuelta
-- Order status: pendiente | pagado | enviado | completado | cancelado
-- Stock decrement on confirm: trigger on orders.status change to pagado/enviado/completado

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enums
DO 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin','vendedor','cliente');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM ('pendiente','pagado','enviado','completado','cancelado');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'complaint_status') THEN
    CREATE TYPE complaint_status AS ENUM ('enviada','en revisión','resuelta');
  END IF;
END;

-- Helper: updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS 
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
 LANGUAGE plpgsql;

-- users
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  email_verified_at TIMESTAMPTZ NULL,
  password VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'cliente',
  account_created_by_system BOOLEAN NOT NULL DEFAULT FALSE,
  remember_token VARCHAR(100) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- seller_profiles
CREATE TABLE IF NOT EXISTS seller_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE,
  business_name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  phone VARCHAR(50) NULL,
  address TEXT NULL,
  logo VARCHAR(255) NULL,
  qr_payload TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_seller_profiles_user_id
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_seller_profiles_user_id ON seller_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_profiles_business_name ON seller_profiles(business_name);

DROP TRIGGER IF EXISTS trg_seller_profiles_updated_at ON seller_profiles;
CREATE TRIGGER trg_seller_profiles_updated_at
BEFORE UPDATE ON seller_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- products
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  seller_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image VARCHAR(255) NULL,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_products_seller_id
    FOREIGN KEY (seller_id) REFERENCES seller_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- carousel_slides
CREATE TABLE IF NOT EXISTS carousel_slides (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NULL,
  subtitle VARCHAR(255) NULL,
  image VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carousel_slides_active ON carousel_slides(active);
CREATE INDEX IF NOT EXISTS idx_carousel_slides_sort_order ON carousel_slides(sort_order);

DROP TRIGGER IF EXISTS trg_carousel_slides_updated_at ON carousel_slides;
CREATE TRIGGER trg_carousel_slides_updated_at
BEFORE UPDATE ON carousel_slides
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- news
CREATE TABLE IF NOT EXISTS news (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  image VARCHAR(255) NULL,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_is_published ON news(is_published);
CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at);

DROP TRIGGER IF EXISTS trg_news_updated_at ON news;
CREATE TRIGGER trg_news_updated_at
BEFORE UPDATE ON news
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- promotions
CREATE TABLE IF NOT EXISTS promotions (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  image VARCHAR(255) NULL,
  discount_badge VARCHAR(100) NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(active);

DROP TRIGGER IF EXISTS trg_promotions_updated_at ON promotions;
CREATE TRIGGER trg_promotions_updated_at
BEFORE UPDATE ON promotions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- site_settings
CREATE TABLE IF NOT EXISTS site_settings (
  id BIGSERIAL PRIMARY KEY,
  key VARCHAR(191) NOT NULL UNIQUE,
  value TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);

DROP TRIGGER IF EXISTS trg_site_settings_updated_at ON site_settings;
CREATE TRIGGER trg_site_settings_updated_at
BEFORE UPDATE ON site_settings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- orders
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  order_number VARCHAR(20) NOT NULL UNIQUE,
  client_id BIGINT NOT NULL,
  seller_id BIGINT NOT NULL,
  total NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  status order_status NOT NULL DEFAULT 'pendiente',
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NULL,
  address TEXT NOT NULL,
  payment_method VARCHAR(20) NOT NULL DEFAULT 'qr',
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_orders_client_id
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_orders_seller_id
    FOREIGN KEY (seller_id) REFERENCES seller_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- order_items
CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL,
  product_id BIGINT NULL,
  product_name VARCHAR(255) NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  quantity INT NOT NULL CHECK (quantity > 0),
  subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_order_items_order_id
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product_id
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

DROP TRIGGER IF EXISTS trg_order_items_updated_at ON order_items;
CREATE TRIGGER trg_order_items_updated_at
BEFORE UPDATE ON order_items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- complaints
CREATE TABLE IF NOT EXISTS complaints (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL,
  seller_id BIGINT NOT NULL,
  order_id BIGINT NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status complaint_status NOT NULL DEFAULT 'enviada',
  pdf_path VARCHAR(255) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_complaints_client_id
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_complaints_seller_id
    FOREIGN KEY (seller_id) REFERENCES seller_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_complaints_order_id
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_complaints_client_id ON complaints(client_id);
CREATE INDEX IF NOT EXISTS idx_complaints_seller_id ON complaints(seller_id);
CREATE INDEX IF NOT EXISTS idx_complaints_order_id ON complaints(order_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);

DROP TRIGGER IF EXISTS trg_complaints_updated_at ON complaints;
CREATE TRIGGER trg_complaints_updated_at
BEFORE UPDATE ON complaints
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- order_number generator: ORD-YYYYMMDD-NNNN (counts orders of same day)
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS 
DECLARE
  day_str TEXT := to_char(current_date, 'YYYYMMDD');
  next_seq INT;
  res TEXT;
BEGIN
  SELECT COALESCE(COUNT(*) + 1, 1)
    INTO next_seq
    FROM orders
    WHERE order_number LIKE 'ORD-' || day_str || '-%';

  IF next_seq < 1 THEN next_seq := 1; END IF;
  res := 'ORD-' || day_str || '-' || lpad(next_seq::TEXT, 4, '0');
  RETURN res;
END;
 LANGUAGE plpgsql STABLE;

-- Stock decrement on confirm (pagado/enviado/completado)
CREATE OR REPLACE FUNCTION decrement_stock_on_order_confirm()
RETURNS TRIGGER AS 
DECLARE
  r RECORD;
BEGIN
  IF NEW.status IN ('pagado','enviado','completado')
     AND (OLD.status IS NULL OR OLD.status NOT IN ('pagado','enviado','completado'))
  THEN
    FOR r IN
      SELECT oi.product_id, oi.quantity
      FROM order_items oi
      WHERE oi.order_id = NEW.id
        AND oi.product_id IS NOT NULL
    LOOP
      UPDATE products p
      SET stock = p.stock - r.quantity,
          updated_at = NOW()
      WHERE p.id = r.product_id
        AND p.stock >= r.quantity;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient stock or product % not found for order %', r.product_id, NEW.order_number;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
 LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_decrement_stock_on_order_confirm ON orders;
CREATE TRIGGER trg_decrement_stock_on_order_confirm
AFTER UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION decrement_stock_on_order_confirm();


-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE carousel_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- users
DROP POLICY IF EXISTS users_select ON users;
CREATE POLICY users_select ON users FOR SELECT USING (true);
DROP POLICY IF EXISTS users_insert ON users;
CREATE POLICY users_insert ON users FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS users_update ON users;
CREATE POLICY users_update ON users FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS users_delete ON users;
CREATE POLICY users_delete ON users FOR DELETE USING (true);

-- seller_profiles
DROP POLICY IF EXISTS seller_profiles_public_select ON seller_profiles;
CREATE POLICY seller_profiles_public_select ON seller_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS seller_profiles_write ON seller_profiles;
CREATE POLICY seller_profiles_write ON seller_profiles FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS seller_profiles_update ON seller_profiles;
CREATE POLICY seller_profiles_update ON seller_profiles FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS seller_profiles_delete ON seller_profiles;
CREATE POLICY seller_profiles_delete ON seller_profiles FOR DELETE USING (true);

-- products
DROP POLICY IF EXISTS products_public_active_select ON products;
CREATE POLICY products_public_active_select ON products FOR SELECT USING (active = TRUE);
DROP POLICY IF EXISTS products_write ON products;
CREATE POLICY products_write ON products FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS products_update ON products;
CREATE POLICY products_update ON products FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS products_delete ON products;
CREATE POLICY products_delete ON products FOR DELETE USING (true);

-- carousel_slides
DROP POLICY IF EXISTS carousel_slides_public_active_select ON carousel_slides;
CREATE POLICY carousel_slides_public_active_select ON carousel_slides FOR SELECT USING (active = TRUE);
DROP POLICY IF EXISTS carousel_slides_write ON carousel_slides;
CREATE POLICY carousel_slides_write ON carousel_slides FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS carousel_slides_update ON carousel_slides;
CREATE POLICY carousel_slides_update ON carousel_slides FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS carousel_slides_delete ON carousel_slides;
CREATE POLICY carousel_slides_delete ON carousel_slides FOR DELETE USING (true);

-- news
DROP POLICY IF EXISTS news_public_published_select ON news;
CREATE POLICY news_public_published_select ON news FOR SELECT USING (is_published = TRUE);
DROP POLICY IF EXISTS news_write ON news;
CREATE POLICY news_write ON news FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS news_update ON news;
CREATE POLICY news_update ON news FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS news_delete ON news;
CREATE POLICY news_delete ON news FOR DELETE USING (true);

-- promotions
DROP POLICY IF EXISTS promotions_public_active_select ON promotions;
CREATE POLICY promotions_public_active_select ON promotions FOR SELECT USING (active = TRUE);
DROP POLICY IF EXISTS promotions_write ON promotions;
CREATE POLICY promotions_write ON promotions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS promotions_update ON promotions;
CREATE POLICY promotions_update ON promotions FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS promotions_delete ON promotions;
CREATE POLICY promotions_delete ON promotions FOR DELETE USING (true);

-- site_settings
DROP POLICY IF EXISTS site_settings_public_select ON site_settings;
CREATE POLICY site_settings_public_select ON site_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS site_settings_write ON site_settings;
CREATE POLICY site_settings_write ON site_settings FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS site_settings_update ON site_settings;
CREATE POLICY site_settings_update ON site_settings FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS site_settings_delete ON site_settings;
CREATE POLICY site_settings_delete ON site_settings FOR DELETE USING (true);

-- orders
DROP POLICY IF EXISTS orders_select ON orders;
CREATE POLICY orders_select ON orders FOR SELECT USING (true);
DROP POLICY IF EXISTS orders_insert ON orders;
CREATE POLICY orders_insert ON orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS orders_update ON orders;
CREATE POLICY orders_update ON orders FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS orders_delete ON orders;
CREATE POLICY orders_delete ON orders FOR DELETE USING (true);

-- order_items
DROP POLICY IF EXISTS order_items_select ON order_items;
CREATE POLICY order_items_select ON order_items FOR SELECT USING (true);
DROP POLICY IF EXISTS order_items_insert ON order_items;
CREATE POLICY order_items_insert ON order_items FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS order_items_update ON order_items;
CREATE POLICY order_items_update ON order_items FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS order_items_delete ON order_items;
CREATE POLICY order_items_delete ON order_items FOR DELETE USING (true);

-- complaints
DROP POLICY IF EXISTS complaints_select ON complaints;
CREATE POLICY complaints_select ON complaints FOR SELECT USING (true);
DROP POLICY IF EXISTS complaints_insert ON complaints;
CREATE POLICY complaints_insert ON complaints FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS complaints_update ON complaints;
CREATE POLICY complaints_update ON complaints FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS complaints_delete ON complaints;
CREATE POLICY complaints_delete ON complaints FOR DELETE USING (true);


-- seed
INSERT INTO users (name, email, email_verified_at, password, role, account_created_by_system, remember_token)
VALUES ('Admin Tienda','admin@tienda.com',NOW(),crypt('password',gen_salt('bf')),'admin',FALSE,NULL)
ON CONFLICT (email) DO NOTHING;

DO 
DECLARE
  v_user_id BIGINT;
  v_seller_id BIGINT;
  v_business VARCHAR(255) := 'Tienda Demo Vendedor';
  v_email VARCHAR(255) := 'vendedor@tienda.com';
BEGIN
  INSERT INTO users (name,email,email_verified_at,password,role,account_created_by_system,remember_token)
  VALUES ('Vendedor Demo',v_email,NOW(),crypt('password',gen_salt('bf')),'vendedor',FALSE,NULL)
  ON CONFLICT (email) DO NOTHING;
  SELECT id INTO v_user_id FROM users WHERE email=v_email;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO seller_profiles (user_id,business_name,description,phone,address,logo,qr_payload)
    VALUES (v_user_id,v_business,'Vendedor de ejemplo para pruebas','+51 999 999 999','Av. Demo 123, Ciudad',NULL,'PAGO|'||v_business||'|'||v_email)
    ON CONFLICT (user_id) DO NOTHING;
    SELECT id INTO v_seller_id FROM seller_profiles WHERE user_id=v_user_id;
    IF v_seller_id IS NOT NULL THEN
      INSERT INTO products (seller_id,name,description,price,stock,image,is_featured,active)
      VALUES
        (v_seller_id,'Producto A','Descripción de Producto A',25.00,50,NULL,TRUE,TRUE),
        (v_seller_id,'Producto B','Descripción de Producto B',40.00,30,NULL,FALSE,TRUE)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
END;

INSERT INTO users (name,email,email_verified_at,password,role,account_created_by_system,remember_token)
VALUES ('Cliente Demo','cliente@tienda.com',NOW(),crypt('password',gen_salt('bf')),'cliente',FALSE,NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO carousel_slides (title,subtitle,image,sort_order,active)
VALUES ('Bienvenido','Tienda de ejemplo','carousel/slide1.jpg',0,TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO news (title,body,image,is_published)
VALUES ('Novedades','Bienvenido a nuestra tienda',NULL,TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO promotions (title,description,image,discount_badge,active)
VALUES ('Promoción','Descuentos especiales',NULL,'OFERTA',TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO site_settings (key,value)
VALUES ('site_name','Tienda Ejemplo'),('currency','PEN')
ON CONFLICT (key) DO NOTHING;

