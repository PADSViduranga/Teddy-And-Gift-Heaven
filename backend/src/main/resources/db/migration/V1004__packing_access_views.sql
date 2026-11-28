CREATE SQL SECURITY DEFINER VIEW v_packing_queue AS
SELECT o.order_id, o.status, s.slot_date, o.priority_score,
       (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.order_id) AS items
FROM orders o
JOIN delivery_slots s ON s.slot_id = o.slot_id
WHERE o.status IN ('CONFIRMED', 'PACKING');

CREATE SQL SECURITY DEFINER VIEW v_packing_supplies AS
SELECT item_id, name, unit, qty_on_hand, qty_reserved, qty_available, reorder_level, is_low
FROM v_stock_levels
WHERE item_kind = 'PACKAGING';
