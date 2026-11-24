-- V1003 (Member 10): reporting views for the dashboards (pages 58-62) and reports (pages 63-68)
-- A "sale" is an order that was paid or got further: CONFIRMED, PACKING, PACKED, OUT_FOR_DELIVERY,
-- DELIVERED, COMPLETED or FAILED_DELIVERY.

-- sales per day. Concepts: GROUP BY, COUNT/SUM/AVG, DATE()
CREATE VIEW v_sales_daily AS
SELECT DATE(created_at)            AS sale_date,
       COUNT(*)                    AS orders,
       SUM(total_amount)           AS revenue,
       ROUND(AVG(total_amount), 2) AS avg_order
FROM orders
WHERE status IN ('CONFIRMED','PACKING','PACKED','OUT_FOR_DELIVERY','DELIVERED','COMPLETED','FAILED_DELIVERY')
GROUP BY DATE(created_at);

-- sales per month with a running total for the year and growth on the previous month.
-- Concepts: derived table, window functions SUM() OVER (PARTITION BY ... ORDER BY ...), LAG()
CREATE VIEW v_sales_monthly AS
SELECT m.sale_month,
       m.sale_year,
       m.orders,
       m.revenue,
       SUM(m.revenue) OVER (PARTITION BY m.sale_year ORDER BY m.sale_month) AS revenue_year_to_date,
       LAG(m.revenue) OVER (ORDER BY m.sale_month)                          AS previous_month_revenue,
       ROUND(100 * (m.revenue - LAG(m.revenue) OVER (ORDER BY m.sale_month))
             / NULLIF(LAG(m.revenue) OVER (ORDER BY m.sale_month), 0), 1)   AS growth_pct
FROM (SELECT DATE_FORMAT(created_at, '%Y-%m') AS sale_month,
             YEAR(created_at)                 AS sale_year,
             COUNT(*)                         AS orders,
             SUM(total_amount)                AS revenue
      FROM orders
      WHERE status IN ('CONFIRMED','PACKING','PACKED','OUT_FOR_DELIVERY','DELIVERED','COMPLETED','FAILED_DELIVERY')
      GROUP BY DATE_FORMAT(created_at, '%Y-%m'), YEAR(created_at)) m;

-- every product with its sales, including products that never sold (best sellers and slow stock).
-- Concepts: INNER JOIN, LEFT JOIN to a derived table, RANK() OVER, DATEDIFF
CREATE VIEW v_product_sales AS
SELECT p.item_id,
       s.name,
       c.name                                AS category,
       p.price,
       s.qty_on_hand,
       COALESCE(SUM(x.quantity), 0)          AS units_sold,
       COALESCE(SUM(x.quantity * x.unit_price), 0) AS revenue,
       MAX(x.created_at)                     AS last_sold_at,
       DATEDIFF(CURRENT_DATE, MAX(x.created_at)) AS days_since_last_sale,
       RANK() OVER (ORDER BY COALESCE(SUM(x.quantity), 0) DESC) AS sales_rank
FROM products p
JOIN stock_items s ON s.item_id = p.item_id
JOIN categories c  ON c.category_id = p.category_id
LEFT JOIN (SELECT oi.product_id, oi.quantity, oi.unit_price, o.created_at
           FROM order_items oi
           JOIN orders o ON o.order_id = oi.order_id
           WHERE o.status IN ('CONFIRMED','PACKING','PACKED','OUT_FOR_DELIVERY','DELIVERED','COMPLETED','FAILED_DELIVERY')) x
       ON x.product_id = p.item_id
GROUP BY p.item_id, s.name, c.name, p.price, s.qty_on_hand;

-- sales per category, including categories with no products or no sales.
-- Concepts: RIGHT JOIN
CREATE VIEW v_category_sales AS
SELECT c.category_id,
       c.name                           AS category,
       COUNT(ps.item_id)                AS products,
       COALESCE(SUM(ps.units_sold), 0)  AS units_sold,
       COALESCE(SUM(ps.revenue), 0)     AS revenue
FROM v_product_sales ps
RIGHT JOIN categories c ON c.name = ps.category
GROUP BY c.category_id, c.name;

-- orders by gift season and year, by delivery date.
-- Concepts: CASE on MONTH()/DAY(), GROUP BY two columns, INNER JOIN
CREATE VIEW v_seasonal_demand AS
SELECT t.season,
       t.season_year,
       COUNT(*)                     AS orders,
       SUM(t.total_amount)          AS revenue,
       ROUND(AVG(t.total_amount), 2) AS avg_order,
       COUNT(DISTINCT t.slot_date)  AS delivery_days,
       ROUND(COUNT(*) / COUNT(DISTINCT t.slot_date), 1) AS orders_per_day
FROM (SELECT o.total_amount, s.slot_date, YEAR(s.slot_date) AS season_year,
             CASE
               WHEN MONTH(s.slot_date) = 2  AND DAY(s.slot_date) <= 14 THEN 'Valentine''s Day'
               WHEN MONTH(s.slot_date) = 5  AND DAY(s.slot_date) <= 12 THEN 'Mother''s Day'
               WHEN MONTH(s.slot_date) = 12 AND DAY(s.slot_date) <= 24 THEN 'Christmas'
               ELSE 'Regular days'
             END AS season
      FROM orders o
      JOIN delivery_slots s ON s.slot_id = o.slot_id
      WHERE o.status IN ('CONFIRMED','PACKING','PACKED','OUT_FOR_DELIVERY','DELIVERED','COMPLETED','FAILED_DELIVERY')) t
GROUP BY t.season, t.season_year;

-- every customer with their buying history, including customers who never ordered.
-- Concepts: LEFT JOIN, NTILE() OVER (spending quarter 1 = top 25%), DATEDIFF
CREATE VIEW v_customer_report AS
SELECT c.user_id,
       u.full_name,
       u.phone,
       c.registered_at,
       COUNT(o.order_id)                          AS orders,
       COALESCE(SUM(o.total_amount), 0)           AS total_spent,
       MIN(o.created_at)                          AS first_order_at,
       MAX(o.created_at)                          AS last_order_at,
       DATEDIFF(CURRENT_DATE, MAX(o.created_at))  AS days_since_last_order,
       COUNT(o.order_id) > 1                      AS is_repeat_customer,
       NTILE(4) OVER (ORDER BY COALESCE(SUM(o.total_amount), 0) DESC) AS spending_quarter
FROM customers c
JOIN users u ON u.user_id = c.user_id
LEFT JOIN orders o
       ON o.customer_id = c.user_id
      AND o.status IN ('CONFIRMED','PACKING','PACKED','OUT_FOR_DELIVERY','DELIVERED','COMPLETED','FAILED_DELIVERY')
GROUP BY c.user_id, u.full_name, u.phone, c.registered_at;

-- stock value, availability and losses per item.
-- Concepts: LEFT JOIN (packaging has no selling price; items with no losses), conditional SUM
CREATE VIEW v_stock_loss AS
SELECT s.item_id,
       s.name,
       s.item_kind,
       s.qty_on_hand,
       s.qty_reserved,
       s.qty_on_hand - s.qty_reserved                      AS qty_available,
       s.reorder_level,
       (s.qty_on_hand - s.qty_reserved) <= s.reorder_level AS is_low,
       p.price,
       s.qty_on_hand * p.price                             AS stock_value,
       COALESCE(SUM(CASE WHEN m.type = 'DAMAGE' THEN m.quantity END), 0) AS damaged,
       COALESCE(SUM(CASE WHEN m.type = 'LOSS'   THEN m.quantity END), 0) AS lost,
       COALESCE(SUM(m.quantity), 0) * p.price              AS loss_value
FROM stock_items s
LEFT JOIN products p        ON p.item_id = s.item_id
LEFT JOIN stock_movements m ON m.item_id = s.item_id AND m.type IN ('DAMAGE', 'LOSS')
GROUP BY s.item_id, s.name, s.item_kind, s.qty_on_hand, s.qty_reserved, s.reorder_level, p.price;

-- payments by month, method and status.
-- Concepts: INNER JOIN, GROUP BY three columns, COALESCE
CREATE VIEW v_payment_report AS
SELECT DATE_FORMAT(COALESCE(p.paid_at, o.created_at), '%Y-%m') AS pay_month,
       p.method,
       p.status,
       COUNT(*)      AS payments,
       SUM(p.amount) AS amount
FROM payments p
JOIN orders o ON o.order_id = p.order_id
GROUP BY DATE_FORMAT(COALESCE(p.paid_at, o.created_at), '%Y-%m'), p.method, p.status;

-- each driver's deliveries and on-time rate, including drivers with no deliveries yet.
-- Concepts: chain of LEFT JOINs, conditional counting, percentage with NULLIF
CREATE VIEW v_driver_performance AS
SELECT d.staff_id,
       u.full_name,
       d.vehicle_no,
       COUNT(dl.delivery_id)                                             AS deliveries,
       COALESCE(SUM(dl.status = 'DELIVERED'), 0)                         AS delivered,
       COALESCE(SUM(dl.status = 'FAILED'), 0)                            AS failed,
       COALESCE(SUM(dl.status = 'DELIVERED' AND DATE(dl.delivered_at) <= s.slot_date), 0) AS on_time,
       ROUND(100 * SUM(dl.status = 'DELIVERED' AND DATE(dl.delivered_at) <= s.slot_date)
             / NULLIF(SUM(dl.status = 'DELIVERED'), 0), 1)               AS on_time_pct
FROM drivers d
JOIN users u            ON u.user_id = d.staff_id
LEFT JOIN deliveries dl ON dl.driver_id = d.staff_id
LEFT JOIN orders o      ON o.order_id = dl.order_id
LEFT JOIN delivery_slots s ON s.slot_id = o.slot_id
GROUP BY d.staff_id, u.full_name, d.vehicle_no;

-- units sold vs units received in the last 30 days, per item.
-- An item can appear on either side only, so this needs a FULL OUTER JOIN.
-- MySQL has no FULL JOIN, so it is written as LEFT JOIN UNION RIGHT JOIN.
CREATE VIEW v_stock_in_out_30d AS
SELECT f.item_id, s.name, f.sold_30d, f.received_30d
FROM (
  SELECT sold.item_id, COALESCE(sold.qty, 0) AS sold_30d, COALESCE(recv.qty, 0) AS received_30d
  FROM (SELECT oi.product_id AS item_id, SUM(oi.quantity) AS qty
        FROM order_items oi JOIN orders o ON o.order_id = oi.order_id
        WHERE o.created_at >= CURRENT_DATE - INTERVAL 30 DAY
          AND o.status IN ('CONFIRMED','PACKING','PACKED','OUT_FOR_DELIVERY','DELIVERED','COMPLETED','FAILED_DELIVERY')
        GROUP BY oi.product_id) sold
  LEFT JOIN (SELECT item_id, SUM(quantity) AS qty FROM stock_movements
             WHERE type = 'RECEIPT' AND created_at >= CURRENT_DATE - INTERVAL 30 DAY
             GROUP BY item_id) recv
         ON recv.item_id = sold.item_id
  UNION
  SELECT recv.item_id, COALESCE(sold.qty, 0), COALESCE(recv.qty, 0)
  FROM (SELECT oi.product_id AS item_id, SUM(oi.quantity) AS qty
        FROM order_items oi JOIN orders o ON o.order_id = oi.order_id
        WHERE o.created_at >= CURRENT_DATE - INTERVAL 30 DAY
          AND o.status IN ('CONFIRMED','PACKING','PACKED','OUT_FOR_DELIVERY','DELIVERED','COMPLETED','FAILED_DELIVERY')
        GROUP BY oi.product_id) sold
  RIGHT JOIN (SELECT item_id, SUM(quantity) AS qty FROM stock_movements
              WHERE type = 'RECEIPT' AND created_at >= CURRENT_DATE - INTERVAL 30 DAY
              GROUP BY item_id) recv
          ON recv.item_id = sold.item_id
) f
JOIN stock_items s ON s.item_id = f.item_id;
