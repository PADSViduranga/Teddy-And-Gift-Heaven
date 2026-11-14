-- V103: delivery slots, orders, order items, personalization, discounts, payments

-- one row per delivery date, with a daily capacity for online orders
CREATE TABLE delivery_slots (
  slot_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
  slot_date    DATE NOT NULL,
  capacity     INT  NOT NULL,
  booked_count INT  NOT NULL DEFAULT 0,
  CONSTRAINT uq_delivery_slots_date UNIQUE (slot_date),
  CONSTRAINT ck_slots_capacity CHECK (capacity > 0),
  CONSTRAINT ck_slots_booked   CHECK (booked_count >= 0 AND booked_count <= capacity)
) ENGINE=InnoDB;

CREATE TABLE orders (
  order_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
  customer_id    BIGINT NOT NULL,
  recipient_id   BIGINT NOT NULL,
  slot_id        BIGINT NOT NULL,
  status         ENUM('AWAITING_PAYMENT','CONFIRMED','PACKING','PACKED','OUT_FOR_DELIVERY',
                      'DELIVERED','COMPLETED','EXPIRED','CANCELLED','FAILED_DELIVERY')
                 NOT NULL DEFAULT 'AWAITING_PAYMENT',
  priority_score INT           NOT NULL DEFAULT 0,
  gift_message   VARCHAR(255)  NULL,
  total_amount   DECIMAL(10,2) NOT NULL,
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT ck_orders_total CHECK (total_amount >= 0),
  CONSTRAINT fk_orders_customer  FOREIGN KEY (customer_id)  REFERENCES customers(user_id),
  CONSTRAINT fk_orders_recipient FOREIGN KEY (recipient_id) REFERENCES recipients(recipient_id),
  CONSTRAINT fk_orders_slot      FOREIGN KEY (slot_id)      REFERENCES delivery_slots(slot_id)
) ENGINE=InnoDB;

CREATE TABLE order_items (
  order_item_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id      BIGINT        NOT NULL,
  product_id    BIGINT        NOT NULL,
  quantity      INT           NOT NULL,
  unit_price    DECIMAL(10,2) NOT NULL,
  CONSTRAINT ck_order_items_qty   CHECK (quantity > 0),
  CONSTRAINT ck_order_items_price CHECK (unit_price >= 0),
  CONSTRAINT fk_order_items_order   FOREIGN KEY (order_id)   REFERENCES orders(order_id),
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(item_id)
) ENGINE=InnoDB;

CREATE TABLE order_personalizations (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_item_id BIGINT        NOT NULL,
  option_id     INT           NOT NULL,
  custom_text   VARCHAR(255)  NULL,
  extra_cost    DECIMAL(10,2) NOT NULL DEFAULT 0,
  CONSTRAINT ck_order_pers_cost CHECK (extra_cost >= 0),
  CONSTRAINT fk_order_pers_item   FOREIGN KEY (order_item_id) REFERENCES order_items(order_item_id),
  CONSTRAINT fk_order_pers_option FOREIGN KEY (option_id)     REFERENCES personalization_options(option_id)
) ENGINE=InnoDB;

CREATE TABLE discounts (
  discount_id INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(80)   NOT NULL,
  rule_type   ENUM('PERCENT','FIXED') NOT NULL,
  value       DECIMAL(10,2) NOT NULL,
  start_date  DATE NOT NULL,
  end_date    DATE NULL,
  CONSTRAINT ck_discounts_value CHECK (value > 0),
  CONSTRAINT ck_discounts_dates CHECK (end_date IS NULL OR end_date >= start_date)
) ENGINE=InnoDB;

CREATE TABLE order_discounts (
  order_id    BIGINT        NOT NULL,
  discount_id INT           NOT NULL,
  amount      DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (order_id, discount_id),
  CONSTRAINT ck_order_discounts_amount CHECK (amount >= 0),
  CONSTRAINT fk_od_order    FOREIGN KEY (order_id)    REFERENCES orders(order_id),
  CONSTRAINT fk_od_discount FOREIGN KEY (discount_id) REFERENCES discounts(discount_id)
) ENGINE=InnoDB;

CREATE TABLE payments (
  payment_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id       BIGINT        NOT NULL,
  confirmed_by   BIGINT        NULL,
  method         ENUM('CASH_ON_DELIVERY','BANK_TRANSFER') NOT NULL,
  amount         DECIMAL(10,2) NOT NULL,
  status         ENUM('PENDING','CONFIRMED','REJECTED','REFUNDED') NOT NULL DEFAULT 'PENDING',
  slip_reference VARCHAR(255)  NULL,
  paid_at        DATETIME      NULL,
  CONSTRAINT ck_payments_amount CHECK (amount >= 0),
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id)     REFERENCES orders(order_id),
  CONSTRAINT fk_payments_user  FOREIGN KEY (confirmed_by) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- indexes for the common searches (packing queue, customer history, reports)
CREATE INDEX idx_orders_customer     ON orders(customer_id);
CREATE INDEX idx_orders_status_slot  ON orders(status, slot_id);
CREATE INDEX idx_orders_created      ON orders(created_at);
CREATE INDEX idx_order_items_order   ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_payments_order      ON payments(order_id, status);
