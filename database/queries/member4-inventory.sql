-- Member 4 (Inventory): demo queries for the report and the viva.
-- Run them in MySQL Workbench after the backend has started once (so Flyway has built V401).
-- Each block says which syllabus topic it shows.


-- 1. VIEW: every item with available stock and a low flag
SELECT name, item_kind, qty_on_hand, qty_reserved, qty_available, reorder_level, is_low
FROM v_stock_levels
ORDER BY is_low DESC, qty_available;


-- 2. SUBQUERY (IN): items at or below their reorder level
SELECT item_id, name, qty_on_hand - qty_reserved AS available, reorder_level
FROM stock_items
WHERE item_id IN (SELECT item_id FROM stock_items
                  WHERE qty_on_hand - qty_reserved <= reorder_level);


-- 3. CORRELATED SUBQUERY: latest supplier price for each low item (v_low_stock uses this)
SELECT s.name,
       (SELECT sp.unit_price FROM supplier_prices sp
        WHERE sp.item_id = s.item_id
        ORDER BY sp.valid_from DESC LIMIT 1) AS last_supplier_price
FROM stock_items s
WHERE s.qty_on_hand - s.qty_reserved <= s.reorder_level;


-- 4. SUBQUERY with an aggregate: products holding more stock than the average product
SELECT s.name, s.qty_on_hand
FROM stock_items s
WHERE s.item_kind = 'PRODUCT'
  AND s.qty_on_hand > (SELECT AVG(qty_on_hand) FROM stock_items WHERE item_kind = 'PRODUCT');


-- 5. LEFT JOIN: products that have never had a stock movement (never sold, received or damaged)
SELECT s.item_id, s.name
FROM stock_items s
LEFT JOIN stock_movements m ON m.item_id = s.item_id
WHERE s.item_kind = 'PRODUCT' AND m.movement_id IS NULL;


-- 6. RIGHT JOIN: every category with how many units it holds, including empty categories
SELECT c.name AS category, COALESCE(SUM(s.qty_on_hand), 0) AS units_in_stock
FROM products p
JOIN stock_items s ON s.item_id = p.item_id
RIGHT JOIN categories c ON c.category_id = p.category_id
GROUP BY c.category_id, c.name;


-- 7. GROUP BY + HAVING: items that lost more than 5 units to damage or loss this year
SELECT item_name, SUM(quantity) AS units_lost
FROM v_stock_movements
WHERE type IN ('DAMAGE', 'LOSS') AND YEAR(created_at) = YEAR(CURRENT_DATE)
GROUP BY item_id, item_name
HAVING SUM(quantity) > 5
ORDER BY units_lost DESC;


-- 8. TRIGGER demo: insert a movement and watch stock_items change by itself
--    (use an item id from query 1)
-- SELECT qty_on_hand FROM stock_items WHERE item_id = 1;
-- INSERT INTO stock_movements (item_id, type, quantity, reason) VALUES (1, 'RECEIPT', 10, 'Demo delivery');
-- SELECT qty_on_hand FROM stock_items WHERE item_id = 1;      -- 10 more than before


-- 9. TRIGGER with SIGNAL: the database refuses to oversell or to sell without a reservation
-- INSERT INTO stock_movements (item_id, type, quantity) VALUES (1, 'SALE', 1);
--   -> ERROR 1644: A sale must come from reserved stock


-- 10. STORED PROCEDURE + approval rule
-- CALL sp_adjust_stock(1, 25, 'Stock count', 2, NULL);
--   -> ERROR 1644: Changes of more than 20 need the owner's approval
-- CALL sp_adjust_stock(1, 25, 'Stock count', 2, 1);    -- works when user 1 is the owner


-- 11. ROW LOCKING (FOR UPDATE): two customers, one last teddy. Open TWO Workbench tabs.
--   Tab A: START TRANSACTION; CALL sp_reserve_stock(<order A>, <item>, 1, NOW() + INTERVAL 15 MINUTE);
--          (don't commit yet)
--   Tab B: START TRANSACTION; CALL sp_reserve_stock(<order B>, <item>, 1, NOW() + INTERVAL 15 MINUTE);
--          -> Tab B just waits, because Tab A holds the lock on that stock row
--   Tab A: COMMIT;
--   Tab B: -> ERROR 1644: Sorry, only 0 of <item> left


-- 12. TRANSACTION with ROLLBACK: sp_add_product saves three rows or none.
--   A bad category id makes the products insert fail, so the stock_items row is rolled back too:
-- CALL sp_add_product('Test bear', 999, 1000, NULL, NULL, 2, 5, 2, @id);   -> foreign key error
-- SELECT * FROM stock_items WHERE name = 'Test bear';                        -> no rows


-- 13. SCHEDULED EVENT: unpaid reservations are released every minute
--     (SHOW EVENTS needs root or tagh_migrate; tagh_app is not allowed to see events, on purpose)
SHOW EVENTS LIKE 'ev_expire_reservations';
SELECT status, COUNT(*) FROM stock_reservations GROUP BY status;


-- 14. FUNCTION
SELECT name, fn_available_stock(item_id) AS available FROM stock_items LIMIT 10;
SELECT fn_adjustment_approval_limit() AS approval_limit;
