DELIMITER $$

CREATE PROCEDURE sp_register_customer(
    IN p_name VARCHAR(120), IN p_email VARCHAR(150),
    IN p_phone VARCHAR(15), IN p_password_hash VARCHAR(100)
)
SQL SECURITY DEFINER
BEGIN
    DECLARE new_user_id BIGINT;

    INSERT INTO users (role_id, user_type, full_name, email, phone, password_hash)
    VALUES ((SELECT role_id FROM roles WHERE name = 'CUSTOMER'), 'CUSTOMER',
            p_name, p_email, p_phone, p_password_hash);
    SET new_user_id = LAST_INSERT_ID();
    INSERT INTO customers (user_id) VALUES (new_user_id);

    SELECT new_user_id AS user_id;
END$$

DELIMITER ;
