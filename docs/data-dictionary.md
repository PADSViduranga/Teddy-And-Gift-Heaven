# Data dictionary

Generated from the database after migrations V101–V104. Regenerate it whenever the schema changes.

## Tables

| Table | Rows (approx.) | Description |
|---|---|---|
| audit_log | 0 |  |
| categories | 5 |  |
| customers | 0 |  |
| deliveries | 0 |  |
| delivery_slots | 0 |  |
| discounts | 0 |  |
| drivers | 0 |  |
| notifications | 0 |  |
| order_discounts | 0 |  |
| order_items | 0 |  |
| order_personalizations | 0 |  |
| orders | 0 |  |
| packaging_items | 0 |  |
| payments | 0 |  |
| personalization_options | 3 |  |
| price_history | 0 |  |
| product_packaging | 0 |  |
| products | 0 |  |
| purchase_order_items | 0 |  |
| purchase_orders | 0 |  |
| recipients | 0 |  |
| roles | 6 |  |
| staff | 0 |  |
| stock_items | 0 |  |
| stock_movements | 0 |  |
| stock_reservations | 0 |  |
| supplier_prices | 0 |  |
| suppliers | 0 |  |
| users | 0 |  |

## Columns

| Table | Column | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|---|
| audit_log | audit_id | bigint | NO | PRI |  | auto_increment |
| audit_log | user_id | bigint | YES | MUL |  |  |
| audit_log | table_name | varchar(64) | NO | MUL |  |  |
| audit_log | record_id | varchar(64) | NO |  |  |  |
| audit_log | action | enum('INSERT','UPDATE','DELETE') | NO |  |  |  |
| audit_log | old_value | json | YES |  |  |  |
| audit_log | new_value | json | YES |  |  |  |
| audit_log | changed_at | datetime | NO | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| categories | category_id | int | NO | PRI |  | auto_increment |
| categories | name | varchar(80) | NO | UNI |  |  |
| customers | user_id | bigint | NO | PRI |  |  |
| customers | registered_at | datetime | NO |  | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| deliveries | delivery_id | bigint | NO | PRI |  | auto_increment |
| deliveries | order_id | bigint | NO | UNI |  |  |
| deliveries | driver_id | bigint | NO | MUL |  |  |
| deliveries | time_slot | varchar(30) | YES |  |  |  |
| deliveries | status | enum('ASSIGNED','DELIVERED','FAILED') | NO |  | ASSIGNED |  |
| deliveries | failure_reason | varchar(255) | YES |  |  |  |
| deliveries | assigned_at | datetime | NO |  | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| deliveries | delivered_at | datetime | YES |  |  |  |
| deliveries | cash_collected | decimal(10,2) | YES |  |  |  |
| delivery_slots | slot_id | bigint | NO | PRI |  | auto_increment |
| delivery_slots | slot_date | date | NO | UNI |  |  |
| delivery_slots | capacity | int | NO |  |  |  |
| delivery_slots | booked_count | int | NO |  | 0 |  |
| discounts | discount_id | int | NO | PRI |  | auto_increment |
| discounts | name | varchar(80) | NO |  |  |  |
| discounts | rule_type | enum('PERCENT','FIXED') | NO |  |  |  |
| discounts | value | decimal(10,2) | NO |  |  |  |
| discounts | start_date | date | NO |  |  |  |
| discounts | end_date | date | YES |  |  |  |
| drivers | staff_id | bigint | NO | PRI |  |  |
| drivers | vehicle_no | varchar(15) | NO |  |  |  |
| drivers | licence_no | varchar(20) | NO | UNI |  |  |
| notifications | notification_id | bigint | NO | PRI |  | auto_increment |
| notifications | item_id | bigint | YES | MUL |  |  |
| notifications | order_id | bigint | YES | MUL |  |  |
| notifications | type | enum('LOW_STOCK','NEW_ORDER','PAYMENT_EXPIRING','SHORT_DELIVERY') | NO |  |  |  |
| notifications | message | varchar(255) | NO |  |  |  |
| notifications | status | enum('OPEN','READ','RESOLVED') | NO | MUL | OPEN |  |
| notifications | created_at | datetime | NO |  | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| order_discounts | order_id | bigint | NO | PRI |  |  |
| order_discounts | discount_id | int | NO | PRI |  |  |
| order_discounts | amount | decimal(10,2) | NO |  |  |  |
| order_items | order_item_id | bigint | NO | PRI |  | auto_increment |
| order_items | order_id | bigint | NO | MUL |  |  |
| order_items | product_id | bigint | NO | MUL |  |  |
| order_items | quantity | int | NO |  |  |  |
| order_items | unit_price | decimal(10,2) | NO |  |  |  |
| order_personalizations | id | bigint | NO | PRI |  | auto_increment |
| order_personalizations | order_item_id | bigint | NO | MUL |  |  |
| order_personalizations | option_id | int | NO | MUL |  |  |
| order_personalizations | custom_text | varchar(255) | YES |  |  |  |
| order_personalizations | extra_cost | decimal(10,2) | NO |  | 0.00 |  |
| orders | order_id | bigint | NO | PRI |  | auto_increment |
| orders | customer_id | bigint | NO | MUL |  |  |
| orders | recipient_id | bigint | NO | MUL |  |  |
| orders | slot_id | bigint | NO | MUL |  |  |
| orders | status | enum('AWAITING_PAYMENT','CONFIRMED','PACKING','PACKED','OUT_FOR_DELIVERY','DELIVERED','COMPLETED','EXPIRED','CANCELLED','FAILED_DELIVERY') | NO | MUL | AWAITING_PAYMENT |  |
| orders | priority_score | int | NO |  | 0 |  |
| orders | gift_message | varchar(255) | YES |  |  |  |
| orders | total_amount | decimal(10,2) | NO |  |  |  |
| orders | created_at | datetime | NO | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| orders | updated_at | datetime | NO |  | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| packaging_items | item_id | bigint | NO | PRI |  |  |
| packaging_items | unit | varchar(20) | NO |  | piece |  |
| payments | payment_id | bigint | NO | PRI |  | auto_increment |
| payments | order_id | bigint | NO | MUL |  |  |
| payments | confirmed_by | bigint | YES | MUL |  |  |
| payments | method | enum('CASH_ON_DELIVERY','BANK_TRANSFER') | NO |  |  |  |
| payments | amount | decimal(10,2) | NO |  |  |  |
| payments | status | enum('PENDING','CONFIRMED','REJECTED','REFUNDED') | NO |  | PENDING |  |
| payments | slip_reference | varchar(255) | YES |  |  |  |
| payments | paid_at | datetime | YES |  |  |  |
| personalization_options | option_id | int | NO | PRI |  | auto_increment |
| personalization_options | name | varchar(80) | NO | UNI |  |  |
| personalization_options | extra_cost | decimal(10,2) | NO |  | 0.00 |  |
| personalization_options | extra_minutes | int | NO |  | 0 |  |
| personalization_options | is_active | tinyint(1) | NO |  | 1 |  |
| price_history | history_id | bigint | NO | PRI |  | auto_increment |
| price_history | product_id | bigint | NO | MUL |  |  |
| price_history | changed_by | bigint | YES | MUL |  |  |
| price_history | old_price | decimal(10,2) | NO |  |  |  |
| price_history | new_price | decimal(10,2) | NO |  |  |  |
| price_history | changed_at | datetime | NO |  | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| product_packaging | product_id | bigint | NO | PRI |  |  |
| product_packaging | packaging_id | bigint | NO | PRI |  |  |
| product_packaging | qty_needed | int | NO |  | 1 |  |
| products | item_id | bigint | NO | PRI |  |  |
| products | category_id | int | NO | MUL |  |  |
| products | price | decimal(10,2) | NO |  |  |  |
| products | description | text | YES |  |  |  |
| products | image_url | varchar(255) | YES |  |  |  |
| products | is_active | tinyint(1) | NO |  | 1 |  |
| purchase_order_items | po_id | bigint | NO | PRI |  |  |
| purchase_order_items | item_id | bigint | NO | PRI |  |  |
| purchase_order_items | ordered_qty | int | NO |  |  |  |
| purchase_order_items | received_qty | int | NO |  | 0 |  |
| purchase_order_items | unit_cost | decimal(10,2) | NO |  |  |  |
| purchase_orders | po_id | bigint | NO | PRI |  | auto_increment |
| purchase_orders | supplier_id | bigint | NO | MUL |  |  |
| purchase_orders | created_by | bigint | NO | MUL |  |  |
| purchase_orders | approved_by | bigint | YES | MUL |  |  |
| purchase_orders | status | enum('DRAFT','APPROVED','ORDERED','PARTIALLY_RECEIVED','RECEIVED','CANCELLED') | NO |  | DRAFT |  |
| purchase_orders | ordered_at | datetime | NO |  | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| purchase_orders | received_at | datetime | YES |  |  |  |
| recipients | recipient_id | bigint | NO | PRI |  | auto_increment |
| recipients | customer_id | bigint | NO | MUL |  |  |
| recipients | full_name | varchar(120) | NO |  |  |  |
| recipients | phone | varchar(15) | NO |  |  |  |
| recipients | address_line | varchar(255) | NO |  |  |  |
| recipients | city | varchar(60) | NO |  |  |  |
| recipients | is_deleted | tinyint(1) | NO |  | 0 |  |
| roles | role_id | tinyint | NO | PRI |  |  |
| roles | name | varchar(30) | NO | UNI |  |  |
| staff | staff_id | bigint | NO | PRI |  |  |
| staff | hired_on | date | NO |  | curdate() | DEFAULT_GENERATED |
| stock_items | item_id | bigint | NO | PRI |  | auto_increment |
| stock_items | name | varchar(120) | NO |  |  |  |
| stock_items | item_kind | enum('PRODUCT','PACKAGING') | NO | MUL |  |  |
| stock_items | qty_on_hand | int | NO |  | 0 |  |
| stock_items | qty_reserved | int | NO |  | 0 |  |
| stock_items | reorder_level | int | NO |  | 0 |  |
| stock_movements | movement_id | bigint | NO | PRI |  | auto_increment |
| stock_movements | item_id | bigint | NO | MUL |  |  |
| stock_movements | created_by | bigint | YES | MUL |  |  |
| stock_movements | approved_by | bigint | YES | MUL |  |  |
| stock_movements | order_id | bigint | YES | MUL |  |  |
| stock_movements | po_id | bigint | YES | MUL |  |  |
| stock_movements | type | enum('SALE','RESERVE','RELEASE','RECEIPT','DAMAGE','LOSS','RETURN','ADJUSTMENT') | NO |  |  |  |
| stock_movements | quantity | int | NO |  |  |  |
| stock_movements | reason | varchar(255) | YES |  |  |  |
| stock_movements | created_at | datetime | NO |  | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| stock_reservations | reservation_id | bigint | NO | PRI |  | auto_increment |
| stock_reservations | order_id | bigint | NO | MUL |  |  |
| stock_reservations | product_id | bigint | NO | MUL |  |  |
| stock_reservations | quantity | int | NO |  |  |  |
| stock_reservations | expires_at | datetime | NO |  |  |  |
| stock_reservations | status | enum('ACTIVE','CONVERTED','RELEASED','EXPIRED') | NO | MUL | ACTIVE |  |
| supplier_prices | price_id | bigint | NO | PRI |  | auto_increment |
| supplier_prices | supplier_id | bigint | NO | MUL |  |  |
| supplier_prices | item_id | bigint | NO | MUL |  |  |
| supplier_prices | unit_price | decimal(10,2) | NO |  |  |  |
| supplier_prices | valid_from | date | NO |  |  |  |
| suppliers | supplier_id | bigint | NO | PRI |  | auto_increment |
| suppliers | name | varchar(120) | NO | UNI |  |  |
| suppliers | phone | varchar(15) | YES |  |  |  |
| suppliers | email | varchar(150) | YES |  |  |  |
| suppliers | address | varchar(255) | YES |  |  |  |
| users | user_id | bigint | NO | PRI |  | auto_increment |
| users | role_id | tinyint | NO | MUL |  |  |
| users | user_type | enum('CUSTOMER','STAFF') | NO |  |  |  |
| users | full_name | varchar(120) | NO |  |  |  |
| users | email | varchar(150) | NO | UNI |  |  |
| users | phone | varchar(15) | NO |  |  |  |
| users | password_hash | varchar(100) | NO |  |  |  |
| users | is_active | tinyint(1) | NO |  | 1 |  |
| users | failed_logins | tinyint | NO |  | 0 |  |
| users | locked_until | datetime | YES |  |  |  |
| users | created_at | datetime | NO |  | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

## Foreign keys

| Table | Column | References |
|---|---|---|
| audit_log | user_id | users.user_id |
| customers | user_id | users.user_id |
| deliveries | driver_id | drivers.staff_id |
| deliveries | order_id | orders.order_id |
| drivers | staff_id | staff.staff_id |
| notifications | item_id | stock_items.item_id |
| notifications | order_id | orders.order_id |
| order_discounts | discount_id | discounts.discount_id |
| order_discounts | order_id | orders.order_id |
| order_items | order_id | orders.order_id |
| order_items | product_id | products.item_id |
| order_personalizations | option_id | personalization_options.option_id |
| order_personalizations | order_item_id | order_items.order_item_id |
| orders | customer_id | customers.user_id |
| orders | recipient_id | recipients.recipient_id |
| orders | slot_id | delivery_slots.slot_id |
| packaging_items | item_id | stock_items.item_id |
| payments | confirmed_by | users.user_id |
| payments | order_id | orders.order_id |
| price_history | changed_by | users.user_id |
| price_history | product_id | products.item_id |
| product_packaging | packaging_id | packaging_items.item_id |
| product_packaging | product_id | products.item_id |
| products | category_id | categories.category_id |
| products | item_id | stock_items.item_id |
| purchase_order_items | item_id | stock_items.item_id |
| purchase_order_items | po_id | purchase_orders.po_id |
| purchase_orders | approved_by | users.user_id |
| purchase_orders | created_by | users.user_id |
| purchase_orders | supplier_id | suppliers.supplier_id |
| recipients | customer_id | customers.user_id |
| staff | staff_id | users.user_id |
| stock_movements | approved_by | users.user_id |
| stock_movements | created_by | users.user_id |
| stock_movements | item_id | stock_items.item_id |
| stock_movements | order_id | orders.order_id |
| stock_movements | po_id | purchase_orders.po_id |
| stock_reservations | order_id | orders.order_id |
| stock_reservations | product_id | products.item_id |
| supplier_prices | item_id | stock_items.item_id |
| supplier_prices | supplier_id | suppliers.supplier_id |
| users | role_id | roles.role_id |

## Check constraints

| Table | Constraint | Rule |
|---|---|---|
| deliveries | ck_deliveries_cash | ((`cash_collected` is null) or (`cash_collected` >= 0)) |
| deliveries | ck_deliveries_failure | ((`status` <> _utf8mb4\\'FAILED\\') or (`failure_reason` is not null)) |
| delivery_slots | ck_slots_booked | ((`booked_count` >= 0) and (`booked_count` <= `capacity`)) |
| delivery_slots | ck_slots_capacity | (`capacity` > 0) |
| discounts | ck_discounts_dates | ((`end_date` is null) or (`end_date` >= `start_date`)) |
| discounts | ck_discounts_percent | ((`rule_type` = _utf8mb4\\'FIXED\\') or (`value` <= 100)) |
| discounts | ck_discounts_value | (`value` > 0) |
| order_discounts | ck_order_discounts_amount | (`amount` >= 0) |
| order_items | ck_order_items_price | (`unit_price` >= 0) |
| order_items | ck_order_items_qty | (`quantity` > 0) |
| order_personalizations | ck_order_pers_cost | (`extra_cost` >= 0) |
| orders | ck_orders_total | (`total_amount` >= 0) |
| payments | ck_payments_amount | (`amount` >= 0) |
| personalization_options | ck_personalization_cost | (`extra_cost` >= 0) |
| personalization_options | ck_personalization_minutes | (`extra_minutes` >= 0) |
| product_packaging | ck_product_packaging_qty | (`qty_needed` > 0) |
| products | ck_products_price | (`price` >= 0) |
| purchase_order_items | ck_poi_cost | (`unit_cost` >= 0) |
| purchase_order_items | ck_poi_ordered | (`ordered_qty` > 0) |
| purchase_order_items | ck_poi_received | (`received_qty` >= 0) |
| recipients | ck_recipients_phone | regexp_like(`phone`,_utf8mb4\\'^[+0-9 ]{9,15}$\\') |
| stock_items | ck_stock_on_hand | (`qty_on_hand` >= 0) |
| stock_items | ck_stock_reorder | (`reorder_level` >= 0) |
| stock_items | ck_stock_reserved | (`qty_reserved` >= 0) |
| stock_items | ck_stock_reserved_le_on_hand | (`qty_reserved` <= `qty_on_hand`) |
| stock_movements | ck_movements_qty | (`quantity` <> 0) |
| stock_movements | ck_movements_sign | ((`type` = _utf8mb4\\'ADJUSTMENT\\') or (`quantity` > 0)) |
| stock_reservations | ck_reservations_qty | (`quantity` > 0) |
| supplier_prices | ck_supplier_prices_price | (`unit_price` >= 0) |
| suppliers | ck_suppliers_email | ((`email` is null) or (`email` like _utf8mb4\\'%_@_%._%\\')) |
| users | ck_users_email | (`email` like _utf8mb4\\'%_@_%._%\\') |
| users | ck_users_failed | (`failed_logins` >= 0) |
| users | ck_users_phone | regexp_like(`phone`,_utf8mb4\\'^[+0-9 ]{9,15}$\\') |
