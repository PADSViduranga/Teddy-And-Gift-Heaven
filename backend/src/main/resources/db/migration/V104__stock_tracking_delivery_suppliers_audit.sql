-- V104: suppliers and purchasing, stock tracking, price history, deliveries, audit log

CREATE TABLE suppliers (
  supplier_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  phone       VARCHAR(20)  NULL,
  email       VARCHAR(150) NULL,
  address     VARCHAR(255) NULL,
  CONSTRAINT uq_suppliers_name UNIQUE (name)
) ENGINE=InnoDB;

CREATE TABLE supplier_prices (
  price_id    BIGINT AUTO_INCREMENT PRIMARY KEY,
  supplier_id BIGINT        NOT NULL,
  item_id     BIGINT        NOT NULL,
  unit_price  DECIMAL(10,2) NOT NULL,
  valid_from  DATE          NOT NULL,
  CONSTRAINT ck_supplier_prices_price CHECK (unit_price >= 0),
  CONSTRAINT fk_sp_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
  CONSTRAINT fk_sp_item     FOREIGN KEY (item_id)     REFERENCES stock_items(item_id)
) ENGINE=InnoDB;

CREATE TABLE purchase_orders (
  po_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
  supplier_id BIGINT NOT NULL,
  created_by  BIGINT NOT NULL,
  approved_by BIGINT NULL,
  status      ENUM('DRAFT','APPROVED','ORDERED','PARTIALLY_RECEIVED','RECEIVED','CANCELLED')
              NOT NULL DEFAULT 'DRAFT',
  ordered_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  received_at DATETIME NULL,
  CONSTRAINT fk_po_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
  CONSTRAINT fk_po_creator  FOREIGN KEY (created_by)  REFERENCES users(user_id),
  CONSTRAINT fk_po_approver FOREIGN KEY (approved_by) REFERENCES users(user_id)
) ENGINE=InnoDB;

CREATE TABLE purchase_order_items (
  po_id        BIGINT        NOT NULL,
  item_id      BIGINT        NOT NULL,
  ordered_qty  INT           NOT NULL,
  received_qty INT           NOT NULL DEFAULT 0,
  unit_cost    DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (po_id, item_id),
  CONSTRAINT ck_poi_ordered  CHECK (ordered_qty > 0),
  CONSTRAINT ck_poi_received CHECK (received_qty >= 0),
  CONSTRAINT ck_poi_cost     CHECK (unit_cost >= 0),
  CONSTRAINT fk_poi_po   FOREIGN KEY (po_id)   REFERENCES purchase_orders(po_id),
  CONSTRAINT fk_poi_item FOREIGN KEY (item_id) REFERENCES stock_items(item_id)
) ENGINE=InnoDB;

-- every change to stock is logged here; triggers keep stock_items in step with this table
CREATE TABLE stock_movements (
  movement_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  item_id     BIGINT NOT NULL,
  created_by  BIGINT NULL,
  approved_by BIGINT NULL,
  order_id    BIGINT NULL,
  po_id       BIGINT NULL,
  type        ENUM('SALE','RESERVE','RELEASE','RECEIPT','DAMAGE','LOSS','RETURN','ADJUSTMENT') NOT NULL,
  quantity    INT NOT NULL,
  reason      VARCHAR(255) NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ck_movements_qty CHECK (quantity <> 0),
  CONSTRAINT fk_sm_item     FOREIGN KEY (item_id)     REFERENCES stock_items(item_id),
  CONSTRAINT fk_sm_creator  FOREIGN KEY (created_by)  REFERENCES users(user_id),
  CONSTRAINT fk_sm_approver FOREIGN KEY (approved_by) REFERENCES users(user_id),
  CONSTRAINT fk_sm_order    FOREIGN KEY (order_id)    REFERENCES orders(order_id),
  CONSTRAINT fk_sm_po       FOREIGN KEY (po_id)       REFERENCES purchase_orders(po_id)
) ENGINE=InnoDB;

-- stock held for an online order until it is paid or expires
CREATE TABLE stock_reservations (
  reservation_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id       BIGINT   NOT NULL,
  product_id     BIGINT   NOT NULL,
  quantity       INT      NOT NULL,
  expires_at     DATETIME NOT NULL,
  status         ENUM('ACTIVE','CONVERTED','RELEASED','EXPIRED') NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT ck_reservations_qty CHECK (quantity > 0),
  CONSTRAINT fk_res_order   FOREIGN KEY (order_id)   REFERENCES orders(order_id),
  CONSTRAINT fk_res_product FOREIGN KEY (product_id) REFERENCES products(item_id)
) ENGINE=InnoDB;

CREATE TABLE notifications (
  notification_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  item_id         BIGINT NULL,
  order_id        BIGINT NULL,
  type            ENUM('LOW_STOCK','NEW_ORDER','PAYMENT_EXPIRING') NOT NULL,
  message         VARCHAR(255) NOT NULL,
  status          ENUM('OPEN','READ','RESOLVED') NOT NULL DEFAULT 'OPEN',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_item  FOREIGN KEY (item_id)  REFERENCES stock_items(item_id),
  CONSTRAINT fk_notif_order FOREIGN KEY (order_id) REFERENCES orders(order_id)
) ENGINE=InnoDB;

CREATE TABLE price_history (
  history_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT        NOT NULL,
  changed_by BIGINT        NULL,
  old_price  DECIMAL(10,2) NOT NULL,
  new_price  DECIMAL(10,2) NOT NULL,
  changed_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ph_product FOREIGN KEY (product_id) REFERENCES products(item_id),
  CONSTRAINT fk_ph_user    FOREIGN KEY (changed_by) REFERENCES users(user_id)
) ENGINE=InnoDB;

CREATE TABLE deliveries (
  delivery_id    BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id       BIGINT       NOT NULL,
  driver_id      BIGINT       NOT NULL,
  time_slot      VARCHAR(30)  NULL,
  status         ENUM('ASSIGNED','DELIVERED','FAILED') NOT NULL DEFAULT 'ASSIGNED',
  failure_reason VARCHAR(255) NULL,
  delivered_at   DATETIME     NULL,
  cash_collected DECIMAL(10,2) NULL,
  CONSTRAINT uq_deliveries_order UNIQUE (order_id),
  CONSTRAINT ck_deliveries_cash CHECK (cash_collected IS NULL OR cash_collected >= 0),
  CONSTRAINT fk_del_order  FOREIGN KEY (order_id)  REFERENCES orders(order_id),
  CONSTRAINT fk_del_driver FOREIGN KEY (driver_id) REFERENCES drivers(staff_id)
) ENGINE=InnoDB;

-- append-only record of who changed what (written by triggers; nobody edits it)
CREATE TABLE audit_log (
  audit_id   BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT       NULL,
  table_name VARCHAR(64)  NOT NULL,
  record_id  VARCHAR(64)  NOT NULL,
  action     ENUM('INSERT','UPDATE','DELETE') NOT NULL,
  old_value  JSON NULL,
  new_value  JSON NULL,
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- indexes for the main searches and the scheduled jobs
CREATE INDEX idx_sm_item_time      ON stock_movements(item_id, created_at);
CREATE INDEX idx_sm_order          ON stock_movements(order_id);
CREATE INDEX idx_res_status_expiry ON stock_reservations(status, expires_at);
CREATE INDEX idx_res_order         ON stock_reservations(order_id);
CREATE INDEX idx_notif_status_type ON notifications(status, type);
CREATE INDEX idx_ph_product        ON price_history(product_id, changed_at);
CREATE INDEX idx_del_driver_status ON deliveries(driver_id, status);
CREATE INDEX idx_po_supplier       ON purchase_orders(supplier_id, status);
CREATE INDEX idx_sp_item           ON supplier_prices(item_id, valid_from);
CREATE INDEX idx_audit_record      ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_time        ON audit_log(changed_at);
