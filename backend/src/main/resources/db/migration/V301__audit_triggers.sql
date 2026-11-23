-- V301 (Member 3): audit triggers and an append-only audit log
-- Concepts: AFTER UPDATE / AFTER INSERT triggers, BEFORE triggers with SIGNAL, JSON_OBJECT,
--           session variables (@app_user_id), auditing
--
-- The backend sets @app_user_id on the connection before each call (Member 2).
-- If it isn't set, user_id is stored as NULL ("system").

-- products: price and active flag changes
CREATE TRIGGER tr_products_audit_update
AFTER UPDATE ON products
FOR EACH ROW
BEGIN
  IF NOT (OLD.price <=> NEW.price) OR NOT (OLD.is_active <=> NEW.is_active) THEN
    INSERT INTO audit_log (user_id, table_name, record_id, action, old_value, new_value)
    VALUES ((SELECT user_id FROM users WHERE user_id = @app_user_id),
            'products', NEW.item_id, 'UPDATE',
            JSON_OBJECT('price', OLD.price, 'is_active', OLD.is_active),
            JSON_OBJECT('price', NEW.price, 'is_active', NEW.is_active));
  END IF;
END;

-- orders: status and anything a customer or staff member can edit
CREATE TRIGGER tr_orders_audit_update
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
  IF NOT (OLD.status <=> NEW.status) OR NOT (OLD.slot_id <=> NEW.slot_id)
     OR NOT (OLD.recipient_id <=> NEW.recipient_id) OR NOT (OLD.gift_message <=> NEW.gift_message)
     OR NOT (OLD.total_amount <=> NEW.total_amount) THEN
    INSERT INTO audit_log (user_id, table_name, record_id, action, old_value, new_value)
    VALUES ((SELECT user_id FROM users WHERE user_id = @app_user_id),
            'orders', NEW.order_id, 'UPDATE',
            JSON_OBJECT('status', OLD.status, 'slot_id', OLD.slot_id, 'recipient_id', OLD.recipient_id,
                        'gift_message', OLD.gift_message, 'total_amount', OLD.total_amount),
            JSON_OBJECT('status', NEW.status, 'slot_id', NEW.slot_id, 'recipient_id', NEW.recipient_id,
                        'gift_message', NEW.gift_message, 'total_amount', NEW.total_amount));
  END IF;
END;

-- payments: confirmations and rejections
CREATE TRIGGER tr_payments_audit_update
AFTER UPDATE ON payments
FOR EACH ROW
BEGIN
  IF NOT (OLD.status <=> NEW.status) OR NOT (OLD.amount <=> NEW.amount) THEN
    INSERT INTO audit_log (user_id, table_name, record_id, action, old_value, new_value)
    VALUES ((SELECT user_id FROM users WHERE user_id = @app_user_id),
            'payments', NEW.payment_id, 'UPDATE',
            JSON_OBJECT('status', OLD.status, 'amount', OLD.amount, 'confirmed_by', OLD.confirmed_by),
            JSON_OBJECT('status', NEW.status, 'amount', NEW.amount, 'confirmed_by', NEW.confirmed_by));
  END IF;
END;

-- stock movements: every stock change (they are never updated, only inserted)
CREATE TRIGGER tr_stock_movements_audit_insert
AFTER INSERT ON stock_movements
FOR EACH ROW
BEGIN
  INSERT INTO audit_log (user_id, table_name, record_id, action, old_value, new_value)
  VALUES ((SELECT user_id FROM users WHERE user_id = @app_user_id),
          'stock_movements', NEW.movement_id, 'INSERT', NULL,
          JSON_OBJECT('item_id', NEW.item_id, 'type', NEW.type, 'quantity', NEW.quantity,
                      'reason', NEW.reason, 'approved_by', NEW.approved_by, 'order_id', NEW.order_id));
END;

-- users: role changes and deactivation (never the password)
CREATE TRIGGER tr_users_audit_update
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  IF NOT (OLD.role_id <=> NEW.role_id) OR NOT (OLD.is_active <=> NEW.is_active) THEN
    INSERT INTO audit_log (user_id, table_name, record_id, action, old_value, new_value)
    VALUES ((SELECT user_id FROM users WHERE user_id = @app_user_id),
            'users', NEW.user_id, 'UPDATE',
            JSON_OBJECT('role_id', OLD.role_id, 'is_active', OLD.is_active),
            JSON_OBJECT('role_id', NEW.role_id, 'is_active', NEW.is_active));
  END IF;
END;

-- the audit log is append-only: nobody can change or delete a row, not even the app user
CREATE TRIGGER tr_audit_log_no_update
BEFORE UPDATE ON audit_log
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'audit_log is append-only: rows cannot be changed';
END;

CREATE TRIGGER tr_audit_log_no_delete
BEFORE DELETE ON audit_log
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'audit_log is append-only: rows cannot be deleted';
END;
