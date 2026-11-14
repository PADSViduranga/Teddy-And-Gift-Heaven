-- V101: roles, users and their specializations (EER: users -> customers, staff -> drivers)

CREATE TABLE roles (
  role_id     TINYINT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(30)  NOT NULL UNIQUE,
  description VARCHAR(120) NULL
) ENGINE=InnoDB;

CREATE TABLE users (
  user_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
  role_id       TINYINT      NOT NULL,
  email         VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  user_type     ENUM('CUSTOMER','STAFF') NOT NULL,
  status        ENUM('ACTIVE','INACTIVE','LOCKED') NOT NULL DEFAULT 'ACTIVE',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(role_id)
) ENGINE=InnoDB;

CREATE TABLE customers (
  user_id   BIGINT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  phone     VARCHAR(20)  NOT NULL,
  CONSTRAINT fk_customers_user FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

CREATE TABLE staff (
  user_id   BIGINT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  phone     VARCHAR(20)  NOT NULL,
  hired_on  DATE         NULL,
  CONSTRAINT fk_staff_user FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

CREATE TABLE drivers (
  staff_id    BIGINT PRIMARY KEY,
  vehicle_no  VARCHAR(20) NOT NULL,
  licence_no  VARCHAR(30) NOT NULL,
  CONSTRAINT uq_drivers_licence UNIQUE (licence_no),
  CONSTRAINT fk_drivers_staff FOREIGN KEY (staff_id) REFERENCES staff(user_id)
) ENGINE=InnoDB;

CREATE TABLE recipients (
  recipient_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  customer_id  BIGINT       NOT NULL,
  name         VARCHAR(120) NOT NULL,
  address      VARCHAR(255) NOT NULL,
  phone        VARCHAR(20)  NOT NULL,
  CONSTRAINT fk_recipients_customer FOREIGN KEY (customer_id) REFERENCES customers(user_id)
) ENGINE=InnoDB;

CREATE INDEX idx_recipients_customer ON recipients(customer_id);

-- reference data: the six roles
INSERT INTO roles (name, description) VALUES
  ('OWNER',             'Runs the shop and administers the system'),
  ('ORDER_STAFF',       'Confirms payments and helps customers'),
  ('INVENTORY_MANAGER', 'Manages stock, suppliers and purchasing'),
  ('PACKER',            'Packs orders'),
  ('DRIVER',            'Delivers orders'),
  ('CUSTOMER',          'Online buyer');
