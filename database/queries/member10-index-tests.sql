-- Member 10: index tests. Run before and after V1002 and compare.
-- EXPLAIN shows the plan (type ALL = full table scan; key = the index used; rows = rows MySQL expects to read).
-- EXPLAIN ANALYZE runs the query and shows the real time in milliseconds.

ANALYZE TABLE users, orders, payments, order_items;

-- 1. customer history by phone number
EXPLAIN
SELECT u.user_id, u.full_name, COUNT(o.order_id) AS orders, SUM(o.total_amount) AS spent
FROM users u JOIN orders o ON o.customer_id = u.user_id
WHERE u.phone = '0700000123'
GROUP BY u.user_id, u.full_name;

EXPLAIN ANALYZE
SELECT u.user_id, u.full_name, COUNT(o.order_id) AS orders, SUM(o.total_amount) AS spent
FROM users u JOIN orders o ON o.customer_id = u.user_id
WHERE u.phone = '0700000123'
GROUP BY u.user_id, u.full_name;

-- 2. completed sales per month, last 12 months
EXPLAIN
SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS orders, SUM(total_amount) AS revenue
FROM orders
WHERE status = 'COMPLETED' AND created_at >= CURRENT_DATE - INTERVAL 365 DAY
GROUP BY month;

EXPLAIN ANALYZE
SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS orders, SUM(total_amount) AS revenue
FROM orders
WHERE status = 'COMPLETED' AND created_at >= CURRENT_DATE - INTERVAL 365 DAY
GROUP BY month;

-- 3. payments waiting for confirmation
EXPLAIN
SELECT payment_id, order_id, amount, method FROM payments WHERE status = 'PENDING' ORDER BY payment_id;

EXPLAIN ANALYZE
SELECT payment_id, order_id, amount, method FROM payments WHERE status = 'PENDING' ORDER BY payment_id;

-- 4. top 10 best sellers
EXPLAIN
SELECT product_id, SUM(quantity) AS units, SUM(quantity * unit_price) AS revenue
FROM order_items GROUP BY product_id ORDER BY units DESC LIMIT 10;

EXPLAIN ANALYZE
SELECT product_id, SUM(quantity) AS units, SUM(quantity * unit_price) AS revenue
FROM order_items GROUP BY product_id ORDER BY units DESC LIMIT 10;
