-- V1002 (Member 10): indexes for the reports, tested with EXPLAIN / EXPLAIN ANALYZE
-- before and after (docs/performance/before.txt and after.txt).
-- Concepts: single-column index, composite index, covering index, removing a redundant index

-- 1. find a customer by phone number (was a full scan of users)
CREATE INDEX idx_users_phone ON users(phone);

-- 2. sales by month: status first (exact match), then created_at (range), then total_amount,
--    so the whole query is answered from the index without reading the table (covering index)
CREATE INDEX idx_orders_status_created_total ON orders(status, created_at, total_amount);

-- 3. payments waiting for confirmation (was a full scan of payments)
CREATE INDEX idx_payments_status ON payments(status);

-- 4. best sellers: covering index with every column the query needs
CREATE INDEX idx_order_items_product_cover ON order_items(product_id, quantity, unit_price);

-- the old single-column index on order_items(product_id) is now redundant:
-- the new index starts with product_id, so it also serves the foreign key
DROP INDEX idx_order_items_product ON order_items;
