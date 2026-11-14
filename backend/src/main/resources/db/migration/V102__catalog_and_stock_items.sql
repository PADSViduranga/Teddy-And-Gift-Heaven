-- V102: categories, stock items (supertype), products and packaging (subtypes), personalization options

CREATE TABLE categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(80) NOT NULL,
  CONSTRAINT uq_categories_name UNIQUE (name)
) ENGINE=InnoDB;

-- supertype: everything that has stock (products and packaging materials)
CREATE TABLE stock_items (
  item_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  item_kind     ENUM('PRODUCT','PACKAGING') NOT NULL,
  qty_on_hand   INT NOT NULL DEFAULT 0,
  qty_reserved  INT NOT NULL DEFAULT 0,
  reorder_level INT NOT NULL DEFAULT 0,
  CONSTRAINT ck_stock_on_hand  CHECK (qty_on_hand >= 0),
  CONSTRAINT ck_stock_reserved CHECK (qty_reserved >= 0),
  CONSTRAINT ck_stock_reserved_le_on_hand CHECK (qty_reserved <= qty_on_hand),
  CONSTRAINT ck_stock_reorder  CHECK (reorder_level >= 0)
) ENGINE=InnoDB;

-- subtype: sellable products
CREATE TABLE products (
  item_id     BIGINT PRIMARY KEY,
  category_id INT           NOT NULL,
  price       DECIMAL(10,2) NOT NULL,
  description TEXT          NULL,
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
  CONSTRAINT ck_products_price CHECK (price >= 0),
  CONSTRAINT fk_products_item     FOREIGN KEY (item_id)     REFERENCES stock_items(item_id),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(category_id)
) ENGINE=InnoDB;

-- subtype: boxes, ribbons, cards, wrapping paper
CREATE TABLE packaging_items (
  item_id BIGINT PRIMARY KEY,
  unit    VARCHAR(20) NOT NULL DEFAULT 'piece',
  CONSTRAINT fk_packaging_item FOREIGN KEY (item_id) REFERENCES stock_items(item_id)
) ENGINE=InnoDB;

-- how much packaging one product needs when packed
CREATE TABLE product_packaging (
  product_id   BIGINT NOT NULL,
  packaging_id BIGINT NOT NULL,
  qty_needed   INT    NOT NULL DEFAULT 1,
  PRIMARY KEY (product_id, packaging_id),
  CONSTRAINT ck_product_packaging_qty CHECK (qty_needed > 0),
  CONSTRAINT fk_pp_product   FOREIGN KEY (product_id)   REFERENCES products(item_id),
  CONSTRAINT fk_pp_packaging FOREIGN KEY (packaging_id) REFERENCES packaging_items(item_id)
) ENGINE=InnoDB;

-- embroidery, message card, special wrapping
CREATE TABLE personalization_options (
  option_id     INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(80)   NOT NULL,
  extra_cost    DECIMAL(10,2) NOT NULL DEFAULT 0,
  extra_minutes INT           NOT NULL DEFAULT 0,
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  CONSTRAINT uq_personalization_name UNIQUE (name),
  CONSTRAINT ck_personalization_cost    CHECK (extra_cost >= 0),
  CONSTRAINT ck_personalization_minutes CHECK (extra_minutes >= 0)
) ENGINE=InnoDB;

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_stock_items_kind  ON stock_items(item_kind);

-- starter reference data
INSERT INTO categories (name) VALUES ('Teddy bears'), ('Gift sets'), ('Flowers'), ('Cards and accessories');
INSERT INTO personalization_options (name, extra_cost, extra_minutes) VALUES
  ('Name embroidery', 500.00, 20),
  ('Message card',    150.00, 5),
  ('Special wrapping',300.00, 10);
