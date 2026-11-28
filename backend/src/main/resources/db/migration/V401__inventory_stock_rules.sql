-- V401 (Member 4): inventory business rules inside MySQL
-- Concepts: BEFORE INSERT and AFTER UPDATE triggers, SIGNAL, stored procedures with
--           row locking (SELECT ... FOR UPDATE), a transaction with ROLLBACK (sp_add_product),
--           a function, a scheduled event, views with subqueries and LEFT JOIN
--
-- The golden rule (team contract, "Stock"): nobody updates qty_on_hand or qty_reserved directly.
-- Insert a row into stock_movements and tr_stock_movements_apply moves the numbers.
--
-- About transactions: the shared procedures (sp_reserve_stock and friends) do NOT start or commit
-- a transaction themselves, because Member 5 calls them inside sp_place_online_order. A START
-- TRANSACTION in here would silently commit their half-finished order. They lock the rows they
-- touch with FOR UPDATE, and the caller's transaction decides COMMIT or ROLLBACK.


-- ---------------------------------------------------------------------------------------------
-- 1. Settings
-- ---------------------------------------------------------------------------------------------

-- Function: the size of a manual adjustment that needs the owner's approval.
-- The real number still has to be agreed with the shop owner; change it here in a new migration.
CREATE FUNCTION fn_adjustment_approval_limit()
RETURNS INT
DETERMINISTIC
NO SQL
RETURN 20;

-- Function: stock that can still be sold (on hand minus reserved). Never sell from qty_on_hand.
CREATE FUNCTION fn_available_stock(p_item_id BIGINT)
RETURNS INT
READS SQL DATA
RETURN (SELECT qty_on_hand - qty_reserved FROM stock_items WHERE item_id = p_item_id);


-- ---------------------------------------------------------------------------------------------
-- 2. Triggers
-- ---------------------------------------------------------------------------------------------

-- Trigger: every stock movement updates stock_items before the movement row is saved.
-- BEFORE INSERT, so if the stock would go wrong the whole insert is refused and nothing is logged.
-- Directions follow the table in the team contract.
-- Set @skip_stock_sync = 1 only for bulk loading of historical sample data.
CREATE TRIGGER tr_stock_movements_apply
BEFORE INSERT ON stock_movements
FOR EACH ROW
BEGIN
  DECLARE v_on_hand  INT;
  DECLARE v_reserved INT;
  DECLARE v_msg      VARCHAR(255);

  -- remember who made the change when the caller did not say
  IF NEW.created_by IS NULL THEN
    SET NEW.created_by = (SELECT user_id FROM users WHERE user_id = @app_user_id);
  END IF;

  IF COALESCE(@skip_stock_sync, 0) <> 1 THEN
    SELECT qty_on_hand, qty_reserved INTO v_on_hand, v_reserved
    FROM stock_items WHERE item_id = NEW.item_id
    FOR UPDATE;

    CASE NEW.type
      WHEN 'RESERVE' THEN
        IF NEW.quantity > v_on_hand - v_reserved THEN
          SET v_msg = CONCAT('Not enough stock to reserve: only ', v_on_hand - v_reserved, ' available');
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
        END IF;
        SET v_reserved = v_reserved + NEW.quantity;

      WHEN 'RELEASE' THEN
        IF NEW.quantity > v_reserved THEN
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot release more stock than is reserved';
        END IF;
        SET v_reserved = v_reserved - NEW.quantity;

      WHEN 'SALE' THEN
        -- a sale always comes from a reservation (sp_convert_reservation)
        IF NEW.quantity > v_reserved THEN
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A sale must come from reserved stock';
        END IF;
        SET v_on_hand  = v_on_hand  - NEW.quantity;
        SET v_reserved = v_reserved - NEW.quantity;

      WHEN 'RECEIPT' THEN
        SET v_on_hand = v_on_hand + NEW.quantity;

      WHEN 'RETURN' THEN
        SET v_on_hand = v_on_hand + NEW.quantity;

      WHEN 'DAMAGE' THEN
        IF NEW.quantity > v_on_hand - v_reserved THEN
          SET v_msg = CONCAT('Only ', v_on_hand - v_reserved, ' unreserved in stock, cannot remove ', NEW.quantity);
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
        END IF;
        SET v_on_hand = v_on_hand - NEW.quantity;

      WHEN 'LOSS' THEN
        IF NEW.quantity > v_on_hand - v_reserved THEN
          SET v_msg = CONCAT('Only ', v_on_hand - v_reserved, ' unreserved in stock, cannot remove ', NEW.quantity);
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
        END IF;
        SET v_on_hand = v_on_hand - NEW.quantity;

      WHEN 'ADJUSTMENT' THEN
        IF v_on_hand + NEW.quantity < v_reserved THEN
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Adjustment would leave less stock than is reserved';
        END IF;
        SET v_on_hand = v_on_hand + NEW.quantity;
    END CASE;

    UPDATE stock_items
    SET qty_on_hand = v_on_hand, qty_reserved = v_reserved
    WHERE item_id = NEW.item_id;
  END IF;
END;

-- Trigger: low-stock alert. When available stock drops to the reorder level, open ONE
-- notification; when stock comes back above it, the notification closes itself.
CREATE TRIGGER tr_stock_items_low_stock
AFTER UPDATE ON stock_items
FOR EACH ROW
BEGIN
  DECLARE v_available INT DEFAULT NEW.qty_on_hand - NEW.qty_reserved;

  IF v_available <= NEW.reorder_level THEN
    IF NOT EXISTS (SELECT 1 FROM notifications
                   WHERE item_id = NEW.item_id AND type = 'LOW_STOCK' AND status <> 'RESOLVED') THEN
      INSERT INTO notifications (item_id, type, message)
      VALUES (NEW.item_id, 'LOW_STOCK',
              CONCAT(NEW.name, ' is low: ', v_available, ' available (reorder level ', NEW.reorder_level, ')'));
    END IF;
  ELSE
    UPDATE notifications
    SET status = 'RESOLVED'
    WHERE item_id = NEW.item_id AND type = 'LOW_STOCK' AND status <> 'RESOLVED';
  END IF;
END;

-- ---------------------------------------------------------------------------------------------
-- 3. Procedures other members call (names and parameters fixed by the team contract)
-- ---------------------------------------------------------------------------------------------

-- Procedure: hold stock for an online order until it is paid or the hold expires.
-- Row locking: FOR UPDATE stops two customers reserving the last teddy at the same moment;
-- the second one waits, then sees the new number and is refused.
CREATE PROCEDURE sp_reserve_stock(IN p_order_id BIGINT, IN p_product_id BIGINT,
                                  IN p_qty INT, IN p_expires_at DATETIME)
BEGIN
  DECLARE v_available INT;
  DECLARE v_active    BOOLEAN;
  DECLARE v_name      VARCHAR(120);
  DECLARE v_msg       VARCHAR(255);

  IF p_qty IS NULL OR p_qty <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Quantity must be more than zero';
  END IF;
  IF p_expires_at IS NULL OR p_expires_at <= NOW() THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'The reservation must expire in the future';
  END IF;

  SELECT s.qty_on_hand - s.qty_reserved, p.is_active, s.name
    INTO v_available, v_active, v_name
  FROM stock_items s
  JOIN products p ON p.item_id = s.item_id
  WHERE s.item_id = p_product_id
  FOR UPDATE;

  IF v_name IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Product not found';
  END IF;
  IF NOT v_active THEN
    SET v_msg = CONCAT(v_name, ' is no longer sold');
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
  END IF;
  IF p_qty > v_available THEN
    SET v_msg = CONCAT('Sorry, only ', v_available, ' of ', v_name, ' left');
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
  END IF;

  INSERT INTO stock_reservations (order_id, product_id, quantity, expires_at)
  VALUES (p_order_id, p_product_id, p_qty, p_expires_at);

  INSERT INTO stock_movements (item_id, order_id, type, quantity, reason)
  VALUES (p_product_id, p_order_id, 'RESERVE', p_qty, 'Online order reservation');
END;

-- Procedure: give back every active hold of an order (order cancelled before payment).
CREATE PROCEDURE sp_release_reservation(IN p_order_id BIGINT)
BEGIN
  DECLARE v_count INT;
  -- lock the order's reservations first so the expiry event can't release them twice
  SELECT COUNT(*) INTO v_count FROM stock_reservations
  WHERE order_id = p_order_id AND status = 'ACTIVE'
  FOR UPDATE;

  INSERT INTO stock_movements (item_id, order_id, type, quantity, reason)
  SELECT product_id, order_id, 'RELEASE', quantity, 'Reservation released'
  FROM stock_reservations
  WHERE order_id = p_order_id AND status = 'ACTIVE';

  UPDATE stock_reservations
  SET status = 'RELEASED'
  WHERE order_id = p_order_id AND status = 'ACTIVE';
END;

-- Procedure: payment confirmed, so the held stock becomes a sale (on hand and reserved both go down).
CREATE PROCEDURE sp_convert_reservation(IN p_order_id BIGINT)
BEGIN
  DECLARE v_count INT;
  SELECT COUNT(*) INTO v_count FROM stock_reservations
  WHERE order_id = p_order_id AND status = 'ACTIVE'
  FOR UPDATE;

  INSERT INTO stock_movements (item_id, order_id, type, quantity, reason)
  SELECT product_id, order_id, 'SALE', quantity, 'Order paid'
  FROM stock_reservations
  WHERE order_id = p_order_id AND status = 'ACTIVE';

  UPDATE stock_reservations
  SET status = 'CONVERTED'
  WHERE order_id = p_order_id AND status = 'ACTIVE';
END;

-- Procedure: manual correction after a stock count (up or down).
-- Big changes need the owner's approval (fn_adjustment_approval_limit).
CREATE PROCEDURE sp_adjust_stock(IN p_item_id BIGINT, IN p_qty_delta INT, IN p_reason VARCHAR(255),
                                 IN p_user_id BIGINT, IN p_approved_by BIGINT)
BEGIN
  DECLARE v_msg VARCHAR(255);

  IF p_qty_delta IS NULL OR p_qty_delta = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'The adjustment cannot be zero';
  END IF;
  IF p_reason IS NULL OR TRIM(p_reason) = '' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Please give a reason for the adjustment';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM stock_items WHERE item_id = p_item_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stock item not found';
  END IF;

  IF ABS(p_qty_delta) > fn_adjustment_approval_limit() THEN
    IF p_approved_by IS NULL THEN
      SET v_msg = CONCAT('Changes of more than ', fn_adjustment_approval_limit(), ' need the owner''s approval');
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
    END IF;
    -- subquery: the approver really has to be an active owner
    IF NOT EXISTS (SELECT 1 FROM users
                   WHERE user_id = p_approved_by AND is_active
                     AND role_id = (SELECT role_id FROM roles WHERE name = 'OWNER')) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only the owner can approve a large adjustment';
    END IF;
  END IF;

  INSERT INTO stock_movements (item_id, created_by, approved_by, type, quantity, reason)
  VALUES (p_item_id, p_user_id, p_approved_by, 'ADJUSTMENT', p_qty_delta, TRIM(p_reason));
END;

-- Procedure: record damaged, lost or returned stock, always with a reason.
CREATE PROCEDURE sp_record_loss(IN p_item_id BIGINT, IN p_type VARCHAR(10), IN p_qty INT,
                                IN p_reason VARCHAR(255), IN p_user_id BIGINT)
BEGIN
  IF p_type NOT IN ('DAMAGE', 'LOSS', 'RETURN') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Type must be DAMAGE, LOSS or RETURN';
  END IF;
  IF p_qty IS NULL OR p_qty <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Quantity must be more than zero';
  END IF;
  IF p_reason IS NULL OR TRIM(p_reason) = '' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Please give a reason';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM stock_items WHERE item_id = p_item_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stock item not found';
  END IF;

  INSERT INTO stock_movements (item_id, created_by, type, quantity, reason)
  VALUES (p_item_id, p_user_id, p_type, p_qty, TRIM(p_reason));
END;


-- ---------------------------------------------------------------------------------------------
-- 4. Procedures for Member 4's own pages (these run on their own, so they own their transaction)
-- ---------------------------------------------------------------------------------------------

-- Procedure: add a product. Transaction: stock_items row, products row and the opening stock
-- movement are saved together, or none of them are (EXIT HANDLER does the ROLLBACK).
CREATE PROCEDURE sp_add_product(IN p_name VARCHAR(120), IN p_category_id INT, IN p_price DECIMAL(10,2),
                                IN p_description TEXT, IN p_image_url VARCHAR(255),
                                IN p_reorder_level INT, IN p_opening_qty INT, IN p_user_id BIGINT,
                                OUT p_item_id BIGINT)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF p_name IS NULL OR TRIM(p_name) = '' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Product name is required';
  END IF;
  IF COALESCE(p_opening_qty, 0) < 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Opening stock cannot be negative';
  END IF;

  START TRANSACTION;
    INSERT INTO stock_items (name, item_kind, reorder_level)
    VALUES (TRIM(p_name), 'PRODUCT', COALESCE(p_reorder_level, 0));
    SET p_item_id = LAST_INSERT_ID();

    INSERT INTO products (item_id, category_id, price, description, image_url)
    VALUES (p_item_id, p_category_id, p_price, p_description, p_image_url);

    IF COALESCE(p_opening_qty, 0) > 0 THEN
      INSERT INTO stock_movements (item_id, created_by, type, quantity, reason)
      VALUES (p_item_id, p_user_id, 'RECEIPT', p_opening_qty, 'Opening stock');
    ELSE
      -- no opening stock: touch the row once so tr_stock_items_low_stock can raise the alert
      UPDATE stock_items SET reorder_level = reorder_level WHERE item_id = p_item_id;
    END IF;
  COMMIT;
END;

-- Procedure: add a packaging material (box, ribbon, card, wrapping paper). Same pattern.
CREATE PROCEDURE sp_add_packaging_item(IN p_name VARCHAR(120), IN p_unit VARCHAR(20),
                                       IN p_reorder_level INT, IN p_opening_qty INT,
                                       IN p_user_id BIGINT, OUT p_item_id BIGINT)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF p_name IS NULL OR TRIM(p_name) = '' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Name is required';
  END IF;
  IF COALESCE(p_opening_qty, 0) < 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Opening stock cannot be negative';
  END IF;

  START TRANSACTION;
    INSERT INTO stock_items (name, item_kind, reorder_level)
    VALUES (TRIM(p_name), 'PACKAGING', COALESCE(p_reorder_level, 0));
    SET p_item_id = LAST_INSERT_ID();

    INSERT INTO packaging_items (item_id, unit) VALUES (p_item_id, COALESCE(NULLIF(TRIM(p_unit), ''), 'piece'));

    IF COALESCE(p_opening_qty, 0) > 0 THEN
      INSERT INTO stock_movements (item_id, created_by, type, quantity, reason)
      VALUES (p_item_id, p_user_id, 'RECEIPT', p_opening_qty, 'Opening stock');
    ELSE
      -- no opening stock: touch the row once so tr_stock_items_low_stock can raise the alert
      UPDATE stock_items SET reorder_level = reorder_level WHERE item_id = p_item_id;
    END IF;
  COMMIT;
END;


-- ---------------------------------------------------------------------------------------------
-- 5. Scheduled event
-- ---------------------------------------------------------------------------------------------

-- Event: every minute, give back stock held by unpaid online orders whose hold has run out.
-- (Changing the ORDER to EXPIRED is Member 7's sp_change_order_status; this only frees the stock.)
-- Needs the MySQL event scheduler switched on: SET GLOBAL event_scheduler = ON;
CREATE EVENT ev_expire_reservations
ON SCHEDULE EVERY 1 MINUTE
DO
BEGIN
  DROP TEMPORARY TABLE IF EXISTS tmp_expired;
  CREATE TEMPORARY TABLE tmp_expired AS
    SELECT reservation_id, order_id, product_id, quantity
    FROM stock_reservations
    WHERE status = 'ACTIVE' AND expires_at <= NOW();

  INSERT INTO stock_movements (item_id, order_id, type, quantity, reason)
  SELECT product_id, order_id, 'RELEASE', quantity, 'Reservation expired (not paid in time)'
  FROM tmp_expired;

  UPDATE stock_reservations r
  JOIN tmp_expired e ON e.reservation_id = r.reservation_id
  SET r.status = 'EXPIRED';

  DROP TEMPORARY TABLE tmp_expired;
END;


-- ---------------------------------------------------------------------------------------------
-- 6. Views for the inventory pages
-- ---------------------------------------------------------------------------------------------

-- View: every stock item with available stock and a low flag (pages 17, 22, 60)
CREATE VIEW v_stock_levels AS
SELECT s.item_id,
       s.name,
       s.item_kind,
       c.category_id,
       c.name                                       AS category,
       p.price,
       p.is_active,
       pk.unit,
       s.qty_on_hand,
       s.qty_reserved,
       s.qty_on_hand - s.qty_reserved               AS qty_available,
       s.reorder_level,
       (s.qty_on_hand - s.qty_reserved) <= s.reorder_level AS is_low
FROM stock_items s
LEFT JOIN products        p  ON p.item_id  = s.item_id
LEFT JOIN categories      c  ON c.category_id = p.category_id
LEFT JOIN packaging_items pk ON pk.item_id = s.item_id;

-- View with subqueries: items at or below their reorder level (page 23), with how far below
-- they are and the most recent supplier price (correlated subquery)
CREATE VIEW v_low_stock AS
SELECT s.item_id,
       s.name,
       s.item_kind,
       s.qty_on_hand - s.qty_reserved AS qty_available,
       s.reorder_level,
       s.reorder_level - (s.qty_on_hand - s.qty_reserved) AS shortfall,
       (SELECT sp.unit_price FROM supplier_prices sp
        WHERE sp.item_id = s.item_id
        ORDER BY sp.valid_from DESC, sp.price_id DESC LIMIT 1) AS last_supplier_price,
       (SELECT MIN(n.created_at) FROM notifications n
        WHERE n.item_id = s.item_id AND n.type = 'LOW_STOCK' AND n.status <> 'RESOLVED') AS alert_since
FROM stock_items s
WHERE s.item_id IN (SELECT item_id FROM stock_items
                    WHERE qty_on_hand - qty_reserved <= reorder_level);

-- View with LEFT JOIN: the movement history with names (page 24). LEFT JOIN keeps movements
-- made by the system (the expiry event), which have no user.
CREATE VIEW v_stock_movements AS
SELECT m.movement_id,
       m.created_at,
       m.item_id,
       s.name        AS item_name,
       s.item_kind,
       m.type,
       m.quantity,
       CASE WHEN m.type IN ('RECEIPT', 'RETURN', 'RELEASE') THEN 'IN'
            WHEN m.type = 'ADJUSTMENT' AND m.quantity > 0 THEN 'IN'
            ELSE 'OUT' END AS direction,
       m.reason,
       m.order_id,
       m.po_id,
       u.full_name   AS created_by_name,
       a.full_name   AS approved_by_name
FROM stock_movements m
JOIN stock_items s ON s.item_id = m.item_id
LEFT JOIN users u ON u.user_id = m.created_by
LEFT JOIN users a ON a.user_id = m.approved_by;

-- View: online reservations with how long is left (page 25)
CREATE VIEW v_reservations AS
SELECT r.reservation_id,
       r.order_id,
       r.product_id,
       s.name AS product_name,
       r.quantity,
       r.expires_at,
       r.status,
       GREATEST(TIMESTAMPDIFF(MINUTE, NOW(), r.expires_at), 0) AS minutes_left
FROM stock_reservations r
JOIN stock_items s ON s.item_id = r.product_id;

-- index for the movements page filter (type + newest first)
CREATE INDEX idx_sm_type_time ON stock_movements(type, created_at);
