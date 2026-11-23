-- Member 3: audit and backup queries for the report.
-- Run with: mysql --defaults-extra-file=~/.tagh-migrate.cnf teddy_and_gift_heaven < database/queries/member3-audit.sql

-- LEFT JOIN: every change, including ones made by the system (no user)
SELECT a.audit_id, a.changed_at, a.table_name, COALESCE(u.full_name, 'System') AS changed_by
FROM audit_log a
LEFT JOIN users u ON u.user_id = a.user_id
ORDER BY a.changed_at DESC
LIMIT 20;

-- UNION ALL: data changes and backups in one timeline
SELECT happened_at, source, activity, detail FROM v_activity_feed ORDER BY happened_at DESC LIMIT 20;

-- GROUP BY + HAVING: who makes the most changes (more than 5)
SELECT changed_by, role_name, COUNT(*) AS changes
FROM v_audit_log
GROUP BY changed_by, role_name
HAVING COUNT(*) > 5
ORDER BY changes DESC;

-- date functions: changes per day for the last 7 days
SELECT DATE(changed_at) AS day, COUNT(*) AS changes
FROM audit_log
WHERE changed_at >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)
GROUP BY DATE(changed_at)
ORDER BY day;

-- subquery: products whose price changed more than once
SELECT s.item_id, s.name
FROM stock_items s
WHERE s.item_id IN (SELECT CAST(record_id AS UNSIGNED)
                    FROM audit_log
                    WHERE table_name = 'products'
                    GROUP BY record_id
                    HAVING COUNT(*) > 1);

-- JSON functions: old and new price of every price change
SELECT record_id AS product_id,
       JSON_EXTRACT(old_value, '$.price') AS old_price,
       JSON_EXTRACT(new_value, '$.price') AS new_price,
       changed_at
FROM audit_log
WHERE table_name = 'products'
  AND JSON_EXTRACT(old_value, '$.price') <> JSON_EXTRACT(new_value, '$.price');

-- backup health: last successful backup and how many hours ago (DATEDIFF / TIMESTAMPDIFF)
SELECT MAX(finished_at) AS last_success,
       TIMESTAMPDIFF(HOUR, MAX(finished_at), NOW()) AS hours_ago
FROM backup_history
WHERE status = 'SUCCESS';

-- backup copy of one table (MySQL's version of SELECT INTO)
CREATE TABLE IF NOT EXISTS audit_log_snapshot AS SELECT * FROM audit_log WHERE 1 = 0;
