-- V303 (Member 3): views for page 12 (Audit log viewer)
-- Concepts: views, LEFT JOIN (changes made by the system have no user), CASE, COALESCE, UNION ALL

-- every audit row with who made it and a readable type of change
CREATE VIEW v_audit_log AS
SELECT a.audit_id,
       a.changed_at,
       a.table_name,
       a.record_id,
       a.action,
       a.old_value,
       a.new_value,
       a.user_id,
       COALESCE(u.full_name, 'System') AS changed_by,
       COALESCE(r.name, 'SYSTEM')      AS role_name,
       CASE a.table_name
         WHEN 'products'        THEN 'Product price'
         WHEN 'orders'          THEN 'Order change'
         WHEN 'payments'        THEN 'Payment'
         WHEN 'stock_movements' THEN 'Stock change'
         WHEN 'users'           THEN 'User account'
         ELSE a.table_name
       END AS change_type
FROM audit_log a
LEFT JOIN users u ON u.user_id = a.user_id
LEFT JOIN roles r ON r.role_id = u.role_id;

-- one timeline of everything that happened: data changes and backups together
CREATE VIEW v_activity_feed AS
SELECT changed_at AS happened_at, 'AUDIT' AS source, change_type AS activity,
       CONCAT(table_name, ' #', record_id) AS detail, changed_by
FROM v_audit_log
UNION ALL
SELECT finished_at, 'BACKUP', CONCAT(LOWER(method), ' backup ', LOWER(status)),
       file_name, 'System'
FROM backup_history;
