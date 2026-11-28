-- Run as a MySQL administrator after Flyway, with tagh_app already created.
-- The REVOKE replaces the original setup guide's schema-wide runtime grants.
REVOKE IF EXISTS SELECT, INSERT, UPDATE, DELETE, EXECUTE
ON teddy_and_gift_heaven.* FROM 'tagh_app'@'localhost';

GRANT SELECT (user_id, role_id, full_name, email, password_hash, is_active, failed_logins, locked_until),
      UPDATE (failed_logins, locked_until)
ON teddy_and_gift_heaven.users TO 'tagh_app'@'localhost';
GRANT SELECT ON teddy_and_gift_heaven.roles TO 'tagh_app'@'localhost';
GRANT EXECUTE ON PROCEDURE teddy_and_gift_heaven.sp_register_customer TO 'tagh_app'@'localhost';

GRANT SELECT, INSERT, UPDATE, DELETE ON teddy_and_gift_heaven.categories TO 'tagh_app'@'localhost';
GRANT SELECT, UPDATE ON teddy_and_gift_heaven.stock_items TO 'tagh_app'@'localhost';
GRANT SELECT, UPDATE ON teddy_and_gift_heaven.products TO 'tagh_app'@'localhost';
GRANT UPDATE (unit), SELECT (item_id) ON teddy_and_gift_heaven.packaging_items TO 'tagh_app'@'localhost';
GRANT SELECT, INSERT, UPDATE ON teddy_and_gift_heaven.personalization_options TO 'tagh_app'@'localhost';
GRANT SELECT, INSERT ON teddy_and_gift_heaven.price_history TO 'tagh_app'@'localhost';

GRANT SELECT (order_id, customer_id, recipient_id, slot_id, created_at, status, total_amount)
ON teddy_and_gift_heaven.orders TO 'tagh_app'@'localhost';
GRANT SELECT (recipient_id, full_name, city) ON teddy_and_gift_heaven.recipients TO 'tagh_app'@'localhost';
GRANT SELECT (order_id, time_slot, status, driver_id, assigned_at)
ON teddy_and_gift_heaven.deliveries TO 'tagh_app'@'localhost';
GRANT SELECT (slot_id, slot_date) ON teddy_and_gift_heaven.delivery_slots TO 'tagh_app'@'localhost';
GRANT SELECT (status, method) ON teddy_and_gift_heaven.payments TO 'tagh_app'@'localhost';
GRANT SELECT (status) ON teddy_and_gift_heaven.stock_reservations TO 'tagh_app'@'localhost';
GRANT SELECT (table_name, changed_at, user_id) ON teddy_and_gift_heaven.audit_log TO 'tagh_app'@'localhost';
GRANT SELECT ON teddy_and_gift_heaven.backup_history TO 'tagh_app'@'localhost';

GRANT SELECT ON teddy_and_gift_heaven.v_stock_levels TO 'tagh_app'@'localhost';
GRANT SELECT ON teddy_and_gift_heaven.v_low_stock TO 'tagh_app'@'localhost';
GRANT SELECT ON teddy_and_gift_heaven.v_stock_movements TO 'tagh_app'@'localhost';
GRANT SELECT ON teddy_and_gift_heaven.v_reservations TO 'tagh_app'@'localhost';
GRANT SELECT ON teddy_and_gift_heaven.v_audit_log TO 'tagh_app'@'localhost';
GRANT SELECT ON teddy_and_gift_heaven.v_activity_feed TO 'tagh_app'@'localhost';
GRANT SELECT ON teddy_and_gift_heaven.v_sales_daily TO 'tagh_app'@'localhost';
GRANT SELECT ON teddy_and_gift_heaven.v_sales_monthly TO 'tagh_app'@'localhost';
GRANT SELECT ON teddy_and_gift_heaven.v_product_sales TO 'tagh_app'@'localhost';
GRANT SELECT ON teddy_and_gift_heaven.v_category_sales TO 'tagh_app'@'localhost';
GRANT SELECT ON teddy_and_gift_heaven.v_seasonal_demand TO 'tagh_app'@'localhost';
GRANT SELECT ON teddy_and_gift_heaven.v_customer_report TO 'tagh_app'@'localhost';
GRANT SELECT ON teddy_and_gift_heaven.v_stock_loss TO 'tagh_app'@'localhost';
GRANT SELECT ON teddy_and_gift_heaven.v_payment_report TO 'tagh_app'@'localhost';
GRANT SELECT ON teddy_and_gift_heaven.v_driver_performance TO 'tagh_app'@'localhost';
GRANT SELECT ON teddy_and_gift_heaven.v_stock_in_out_30d TO 'tagh_app'@'localhost';
GRANT SELECT ON teddy_and_gift_heaven.v_packing_queue TO 'tagh_app'@'localhost';
GRANT SELECT ON teddy_and_gift_heaven.v_packing_supplies TO 'tagh_app'@'localhost';

GRANT EXECUTE ON FUNCTION teddy_and_gift_heaven.fn_adjustment_approval_limit TO 'tagh_app'@'localhost';
GRANT EXECUTE ON PROCEDURE teddy_and_gift_heaven.sp_adjust_stock TO 'tagh_app'@'localhost';
GRANT EXECUTE ON PROCEDURE teddy_and_gift_heaven.sp_record_loss TO 'tagh_app'@'localhost';
GRANT EXECUTE ON PROCEDURE teddy_and_gift_heaven.sp_add_product TO 'tagh_app'@'localhost';
GRANT EXECUTE ON PROCEDURE teddy_and_gift_heaven.sp_add_packaging_item TO 'tagh_app'@'localhost';

CREATE ROLE IF NOT EXISTS 'tagh_packing_read';
GRANT SELECT ON teddy_and_gift_heaven.v_packing_queue TO 'tagh_packing_read';
GRANT SELECT ON teddy_and_gift_heaven.v_packing_supplies TO 'tagh_packing_read';

-- Uses MySQL-generated credentials on first creation. Save the returned password securely.
CREATE USER IF NOT EXISTS 'tagh_packer'@'localhost' IDENTIFIED BY RANDOM PASSWORD;
GRANT 'tagh_packing_read' TO 'tagh_packer'@'localhost';
SET DEFAULT ROLE 'tagh_packing_read' TO 'tagh_packer'@'localhost';
