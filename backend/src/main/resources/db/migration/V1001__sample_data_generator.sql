-- V1001 (Member 10): procedure that fills the database with realistic sample data for reports
-- and index tests. Creating it adds no data; run it yourself with CALL sp_generate_sample_data(50000).
-- Concepts: recursive CTE (WITH RECURSIVE), INSERT ... SELECT, window function (ROW_NUMBER),
--           temporary tables, multi-table UPDATE with JOIN, date functions, SIGNAL

CREATE PROCEDURE sp_generate_sample_data(IN p_orders INT)
BEGIN
  DECLARE v_customers INT;
  DECLARE v_products INT;
  DECLARE v_drivers INT;
  DECLARE v_first_item BIGINT;
  DECLARE v_base BIGINT;

  IF EXISTS (SELECT 1 FROM users WHERE email LIKE '%@sample.tagh') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Sample data already exists. Reset the database to generate it again.';
  END IF;

  SET SESSION cte_max_recursion_depth = GREATEST(p_orders, 1000) + 10;

  -- 600 customers
  INSERT INTO users (role_id, user_type, full_name, email, phone, password_hash)
  WITH RECURSIVE seq(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 600)
  SELECT 6, 'CUSTOMER',
         CONCAT(ELT(1 + MOD(n, 10), 'Nimal', 'Kasun', 'Amaya', 'Dilani', 'Tharindu', 'Ishara', 'Sanduni', 'Ruwan', 'Hasini', 'Chamod'), ' ',
                ELT(1 + MOD(FLOOR(n / 10), 8), 'Perera', 'Fernando', 'Silva', 'Jayasinghe', 'Bandara', 'Wickramasinghe', 'Gunawardena', 'Ratnayake')),
         CONCAT('customer', n, '@sample.tagh'),
         CONCAT('07', LPAD(n, 8, '0')),
         'sample-account-cannot-log-in'
  FROM seq;

  INSERT INTO customers (user_id, registered_at)
  SELECT user_id, NOW() - INTERVAL FLOOR(RAND() * 700) DAY
  FROM users WHERE email LIKE 'customer%@sample.tagh';

  INSERT INTO recipients (customer_id, full_name, phone, address_line, city)
  SELECT user_id, CONCAT('Recipient of ', full_name), phone,
         CONCAT(1 + FLOOR(RAND() * 200), ', Temple Road'),
         ELT(1 + FLOOR(RAND() * 6), 'Colombo', 'Kandy', 'Galle', 'Negombo', 'Kurunegala', 'Matara')
  FROM users WHERE email LIKE 'customer%@sample.tagh';

  -- 5 drivers
  INSERT INTO users (role_id, user_type, full_name, email, phone, password_hash)
  WITH RECURSIVE seq(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 5)
  SELECT 5, 'STAFF', CONCAT('Driver ', ELT(n, 'Sunil', 'Pradeep', 'Mahesh', 'Lahiru', 'Gayan')),
         CONCAT('driver', n, '@sample.tagh'), CONCAT('071', LPAD(n, 7, '0')), 'sample-account-cannot-log-in'
  FROM seq;
  INSERT INTO staff (staff_id) SELECT user_id FROM users WHERE email LIKE 'driver%@sample.tagh';
  INSERT INTO drivers (staff_id, vehicle_no, licence_no)
  SELECT user_id, CONCAT('WP CAB-', 1000 + user_id), CONCAT('B', LPAD(user_id, 7, '0'))
  FROM users WHERE email LIKE 'driver%@sample.tagh';

  -- 40 products, 8 in each category
  SELECT COALESCE(MAX(item_id), 0) INTO v_first_item FROM stock_items;
  INSERT INTO stock_items (item_id, name, item_kind, qty_on_hand, qty_reserved, reorder_level)
  WITH RECURSIVE seq(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 40)
  SELECT v_first_item + n,
         CONCAT(ELT(1 + MOD(n - 1, 5), 'Teddy Bear', 'Gift Box', 'Flower Bouquet', 'Chocolate Box', 'Personalized Gift'), ' No. ', n),
         'PRODUCT',
         IF(MOD(n, 9) = 0, 4, 20 + MOD(n * 7, 60)),
         0, 10
  FROM seq;
  INSERT INTO products (item_id, category_id, price, description)
  SELECT s.item_id, c.category_id, ROUND(1500 + MOD((s.item_id - v_first_item) * 137, 6000), -1), 'Sample product'
  FROM stock_items s
  JOIN categories c ON c.name = ELT(1 + MOD(s.item_id - v_first_item - 1, 5),
                                    'Teddy Bears', 'Gift Boxes', 'Flower Gifts', 'Chocolates', 'Personalized Gifts')
  WHERE s.item_id > v_first_item;

  -- delivery dates: 701 days back to 30 days ahead
  INSERT IGNORE INTO delivery_slots (slot_date, capacity)
  WITH RECURSIVE seq(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM seq WHERE n < 731)
  SELECT CURRENT_DATE - INTERVAL 701 DAY + INTERVAL n DAY, 600 FROM seq;

  -- numbered lists of customers, products and drivers (ROW_NUMBER), so random picks are simple
  DROP TEMPORARY TABLE IF EXISTS tmp_customers, tmp_products, tmp_drivers, tmp_orders, tmp_items;
  CREATE TEMPORARY TABLE tmp_customers (rn INT PRIMARY KEY, user_id BIGINT, recipient_id BIGINT);
  INSERT INTO tmp_customers
  SELECT ROW_NUMBER() OVER (ORDER BY c.user_id), c.user_id, r.recipient_id
  FROM customers c JOIN users u ON u.user_id = c.user_id
  JOIN recipients r ON r.customer_id = c.user_id
  WHERE u.email LIKE 'customer%@sample.tagh';
  SELECT COUNT(*) INTO v_customers FROM tmp_customers;

  CREATE TEMPORARY TABLE tmp_products (rn INT PRIMARY KEY, item_id BIGINT, price DECIMAL(10,2));
  INSERT INTO tmp_products
  SELECT ROW_NUMBER() OVER (ORDER BY item_id), item_id, price FROM products WHERE item_id > v_first_item;
  SELECT COUNT(*) INTO v_products FROM tmp_products;

  CREATE TEMPORARY TABLE tmp_drivers (rn INT PRIMARY KEY, staff_id BIGINT);
  INSERT INTO tmp_drivers
  SELECT ROW_NUMBER() OVER (ORDER BY d.staff_id) - 1, d.staff_id
  FROM drivers d JOIN users u ON u.user_id = d.staff_id WHERE u.email LIKE 'driver%@sample.tagh';
  SELECT COUNT(*) INTO v_drivers FROM tmp_drivers;

  -- the orders: random customer (some come back often), random date
  CREATE TEMPORARY TABLE tmp_orders (
    n INT PRIMARY KEY, crn INT, base_date DATE, slot_date DATE, r DOUBLE,
    status VARCHAR(20), created_at DATETIME);
  INSERT INTO tmp_orders (n, crn, base_date)
  WITH RECURSIVE seq(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < p_orders)
  SELECT n, 1 + FLOOR(POW(RAND(), 1.5) * v_customers),
         CURRENT_DATE - INTERVAL FLOOR(RAND() * 700) DAY + INTERVAL 14 DAY
  FROM seq;

  -- about 30% move into a gift season: Valentine's (7-14 Feb), Mother's Day (5-12 May), Christmas (15-24 Dec)
  UPDATE tmp_orders
  SET r = RAND(),
      slot_date = CASE
        WHEN RAND() < 0.3 THEN CASE MOD(n, 3)
          WHEN 0 THEN MAKEDATE(YEAR(base_date), 1) + INTERVAL 1 MONTH + INTERVAL (6 + FLOOR(RAND() * 8)) DAY
          WHEN 1 THEN MAKEDATE(YEAR(base_date), 1) + INTERVAL 4 MONTH + INTERVAL (4 + FLOOR(RAND() * 8)) DAY
          ELSE        MAKEDATE(YEAR(base_date), 1) + INTERVAL 11 MONTH + INTERVAL (14 + FLOOR(RAND() * 10)) DAY
        END
        ELSE base_date END;
  UPDATE tmp_orders SET slot_date = base_date
  WHERE slot_date > CURRENT_DATE + INTERVAL 14 DAY OR slot_date < CURRENT_DATE - INTERVAL 700 DAY;

  UPDATE tmp_orders
  SET status = CASE
        WHEN slot_date >= CURRENT_DATE THEN ELT(1 + FLOOR(RAND() * 4), 'AWAITING_PAYMENT', 'CONFIRMED', 'PACKING', 'PACKED')
        WHEN r < 0.04 THEN 'CANCELLED'
        WHEN r < 0.06 THEN 'EXPIRED'
        WHEN r < 0.08 THEN 'FAILED_DELIVERY'
        ELSE 'COMPLETED' END,
      created_at = LEAST(NOW(), TIMESTAMP(slot_date) - INTERVAL (1 + FLOOR(RAND() * 6)) DAY
                                 + INTERVAL FLOOR(RAND() * 86400) SECOND);

  -- 1 to 3 items per order; low product numbers sell far more, and the last 3 products never sell
  CREATE TEMPORARY TABLE tmp_items (n INT, k INT, prn INT, qty INT, PRIMARY KEY (n, k));
  INSERT INTO tmp_items (n, k, prn, qty)
  SELECT o.n, k.k, 1 + FLOOR(POW(RAND(), 2) * (v_products - 3)), 1 + (RAND() < 0.2)
  FROM tmp_orders o
  JOIN (SELECT 1 AS k UNION ALL SELECT 2 UNION ALL SELECT 3) k
    ON k.k <= 1 + (MOD(o.n, 3) = 0) + (MOD(o.n, 7) = 0);

  -- write the orders with their totals, then their items
  SELECT COALESCE(MAX(order_id), 0) INTO v_base FROM orders;

  INSERT INTO orders (order_id, customer_id, recipient_id, slot_id, status, priority_score,
                      gift_message, total_amount, created_at, updated_at)
  SELECT v_base + o.n, c.user_id, c.recipient_id, s.slot_id, o.status, 0,
         IF(MOD(o.n, 4) = 0, 'With love, from me', NULL), t.total, o.created_at, o.created_at
  FROM tmp_orders o
  JOIN tmp_customers c ON c.rn = o.crn
  JOIN delivery_slots s ON s.slot_date = o.slot_date
  JOIN (SELECT i.n, SUM(i.qty * p.price) AS total
        FROM tmp_items i JOIN tmp_products p ON p.rn = i.prn
        GROUP BY i.n) t ON t.n = o.n;

  INSERT INTO order_items (order_id, product_id, quantity, unit_price)
  SELECT v_base + i.n, p.item_id, i.qty, p.price
  FROM tmp_items i JOIN tmp_products p ON p.rn = i.prn
  WHERE EXISTS (SELECT 1 FROM orders WHERE order_id = v_base + i.n);

  -- one payment per order
  INSERT INTO payments (order_id, method, amount, status, paid_at)
  SELECT order_id,
         IF(MOD(order_id, 3) = 0, 'BANK_TRANSFER', 'CASH_ON_DELIVERY'),
         total_amount,
         CASE status WHEN 'AWAITING_PAYMENT' THEN 'PENDING' WHEN 'EXPIRED' THEN 'REJECTED'
                     WHEN 'CANCELLED' THEN 'REFUNDED' ELSE 'CONFIRMED' END,
         IF(status IN ('AWAITING_PAYMENT', 'EXPIRED'), NULL, created_at + INTERVAL 2 HOUR)
  FROM orders WHERE order_id > v_base;

  -- deliveries for delivered and failed orders; about 8% arrive a day late
  INSERT INTO deliveries (order_id, driver_id, time_slot, status, failure_reason, assigned_at, delivered_at, cash_collected)
  SELECT o.order_id, d.staff_id,
         ELT(1 + MOD(o.order_id, 3), '09:00-12:00', '12:00-15:00', '15:00-18:00'),
         IF(o.status = 'FAILED_DELIVERY', 'FAILED', 'DELIVERED'),
         IF(o.status = 'FAILED_DELIVERY', ELT(1 + MOD(o.order_id, 3), 'Recipient not available', 'Wrong address', 'Refused'), NULL),
         TIMESTAMP(s.slot_date) + INTERVAL 8 HOUR,
         IF(o.status = 'FAILED_DELIVERY', NULL,
            TIMESTAMP(s.slot_date) + INTERVAL (10 + FLOOR(RAND() * 8)) HOUR + INTERVAL (RAND() < 0.08) DAY),
         IF(o.status <> 'FAILED_DELIVERY' AND MOD(o.order_id, 3) <> 0, o.total_amount, NULL)
  FROM orders o
  JOIN delivery_slots s ON s.slot_id = o.slot_id
  JOIN tmp_drivers d ON d.rn = MOD(o.order_id, v_drivers)
  WHERE o.order_id > v_base AND o.status IN ('COMPLETED', 'FAILED_DELIVERY');

  -- how full each delivery date is (multi-table UPDATE with a JOIN)
  UPDATE delivery_slots s
  JOIN (SELECT slot_id, COUNT(*) AS c FROM orders
        WHERE status NOT IN ('CANCELLED', 'EXPIRED') GROUP BY slot_id) x ON x.slot_id = s.slot_id
  SET s.capacity = GREATEST(s.capacity, x.c), s.booked_count = x.c;

  -- some damaged and lost stock, for the stock and loss report
  INSERT INTO stock_movements (item_id, type, quantity, reason, created_at)
  WITH RECURSIVE seq(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 300)
  SELECT v_first_item + 1 + MOD(n * 13, 37),
         IF(MOD(n, 4) = 0, 'LOSS', 'DAMAGE'),
         1 + MOD(n, 2),
         ELT(1 + MOD(n, 4), 'Torn seam', 'Crushed box', 'Wilted flowers', 'Missing after stock count'),
         NOW() - INTERVAL FLOOR(RAND() * 700) DAY
  FROM seq;

  DROP TEMPORARY TABLE IF EXISTS tmp_customers, tmp_products, tmp_drivers, tmp_orders, tmp_items;

  SELECT (SELECT COUNT(*) FROM orders WHERE order_id > v_base)      AS orders_created,
         (SELECT COUNT(*) FROM order_items WHERE order_id > v_base) AS items_created,
         v_customers AS customers, v_products AS products, v_drivers AS drivers;
END;
