-- V101: roles, users (supertype), customers and staff (subtypes), drivers (subtype of staff), recipients
-- Concepts: PRIMARY KEY, FOREIGN KEY, UNIQUE, NOT NULL, CHECK, DEFAULT, AUTO_INCREMENT, EER specialization

CREATE TABLE roles (
  role_id TINYINT     PRIMARY KEY,
  name    VARCHAR(30) NOT NULL,
  CONSTRAINT uq_roles_name UNIQUE (name)
) ENGINE=InnoDB;

-- supertype: everyone who can log in
CREATE TABLE users (
  user_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
  role_id       TINYINT      NOT NULL,
  user_type     ENUM('CUSTOMER','STAFF') NOT NULL,
  full_name     VARCHAR(120) NOT NULL,
  email         VARCHAR(150) NOT NULL,
  phone         VARCHAR(15)  NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  failed_logins TINYINT      NOT NULL DEFAULT 0,
  locked_until  DATETIME     NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT ck_users_email CHECK (email LIKE '%_@_%._%'),
  CONSTRAINT ck_users_phone CHECK (phone REGEXP '^[+0-9 ]{9,15}$'),
  CONSTRAINT ck_users_failed CHECK (failed_logins >= 0),
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(role_id)
) ENGINE=InnoDB;

-- subtype: online customers
CREATE TABLE customers (
  user_id       BIGINT PRIMARY KEY,
  registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_customers_user FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- subtype: shop staff (owner, order staff, inventory manager, packer, driver)
CREATE TABLE staff (
  staff_id  BIGINT PRIMARY KEY,
  hired_on  DATE   NOT NULL DEFAULT (CURRENT_DATE),
  CONSTRAINT fk_staff_user FOREIGN KEY (staff_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- subtype of staff: drivers
CREATE TABLE drivers (
  staff_id   BIGINT      PRIMARY KEY,
  vehicle_no VARCHAR(15) NOT NULL,
  licence_no VARCHAR(20) NOT NULL,
  CONSTRAINT uq_drivers_licence UNIQUE (licence_no),
  CONSTRAINT fk_drivers_staff FOREIGN KEY (staff_id) REFERENCES staff(staff_id)
) ENGINE=InnoDB;

-- gift recipients saved by a customer
CREATE TABLE recipients (
  recipient_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  customer_id  BIGINT       NOT NULL,
  full_name    VARCHAR(120) NOT NULL,
  phone        VARCHAR(15)  NOT NULL,
  address_line VARCHAR(255) NOT NULL,
  city         VARCHAR(60)  NOT NULL,
  is_deleted   BOOLEAN      NOT NULL DEFAULT FALSE,
  CONSTRAINT ck_recipients_phone CHECK (phone REGEXP '^[+0-9 ]{9,15}$'),
  CONSTRAINT fk_recipients_customer FOREIGN KEY (customer_id) REFERENCES customers(user_id)
) ENGINE=InnoDB;

CREATE INDEX idx_users_role         ON users(role_id);
CREATE INDEX idx_recipients_customer ON recipients(customer_id);

-- the six roles
INSERT INTO roles (role_id, name) VALUES
  (1, 'OWNER'),
  (2, 'ORDER_STAFF'),
  (3, 'INVENTORY_MANAGER'),
  (4, 'PACKER'),
  (5, 'DRIVER'),
  (6, 'CUSTOMER');
