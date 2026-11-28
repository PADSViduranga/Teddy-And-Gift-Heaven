# Where each SQL topic is used

This page maps every topic from the ADBMS syllabus to the place in our project where we use it.
When you finish something, update your row with the file name and change the status to Done.

| Topic | Where it's used | Member | File | Status |
|---|---|---|---|---|
| EER: supertype and subtypes | users → customers, staff → drivers; stock_items → products, packaging_items | 1 | V101, V102 | Done |
| Normalization (3NF) | All 29 tables, explained in the data dictionary | 1 | docs/data-dictionary.md | To do |
| PRIMARY KEY, AUTO_INCREMENT | Every table | 1 | V101–V104 | Done |
| Composite primary key | product_packaging, order_discounts, purchase_order_items | 1 | V102–V104 | Done |
| FOREIGN KEY | orders → customers, recipients, delivery_slots and more | 1 | V101–V104 | Done |
| NOT NULL, UNIQUE, DEFAULT | users.email, categories.name, suppliers.name | 1 | V101–V104 | Done |
| CHECK | Reserved stock ≤ on hand, booked orders ≤ capacity, prices ≥ 0 | 1 | V102, V103 | Done |
| Indexes | Orders by status and date, stock movements by item and time, report indexes | 1, 10 | V103, V104, V1002 | Done |
| INNER JOIN | Order lines with product names | 5 | | To do |
| LEFT JOIN | Products never sold (slow stock), customers with no orders | 4, 10 | V1003 `v_product_sales`, `v_customer_report` | Done (Member 10) |
| RIGHT JOIN | Every category with its sales, including empty ones | 4, 10 | V1003 `v_category_sales` | Done (Member 10) |
| FULL JOIN (LEFT JOIN UNION RIGHT JOIN) | Items sold vs items received, last 30 days | 10 | V1003 `v_stock_in_out_30d` | Done |
| UNION / UNION ALL | Combined activity feed (audit changes and backups) | 3 | V303 `v_activity_feed` | Done |
| Subqueries | Items below reorder level (IN), latest supplier price (correlated), above-average stock | 4, 9 | V401 `v_low_stock`, database/queries/member4-inventory.sql | Done (Member 4) |
| GROUP BY, HAVING, aggregates | Monthly sales, seasons, payments, drivers | 8, 10 | V1003 views | Done (Member 10) |
| Date functions | On-time delivery, sales by month, seasons (MONTH, DAY, DATEDIFF, DATE_FORMAT) | 8, 10 | V1003 views | Done (Member 10) |
| Window functions | RANK (best sellers), SUM OVER (year to date), LAG (growth), NTILE (spending groups) | 10 | V1003 | Done |
| Views | Packing queue without prices, driver's own deliveries, reports | 7, 8, 10 | | To do |
| Stored procedures | Place order, confirm payment, assign driver, receive stock | 5, 6, 8, 9 | | To do |
| Functions | Order total, priority score | 5, 6 | | To do |
| Triggers | Stock from movements (`tr_stock_movements_apply`), low-stock alerts (`tr_stock_items_low_stock`), price history, audit log | 3, 4, 6 | V401 | Done (Member 4 part) |
| Transactions (COMMIT / ROLLBACK) | Placing an order, receiving a purchase order | 5, 9 | | To do |
| Row locking (FOR UPDATE) | Stopping two customers from buying the last item | 4, 5 | V401 `sp_reserve_stock`, `tr_stock_movements_apply` | Done (Member 4 part) |
| Scheduled events | Expiring unpaid reservations | 4 | V401 `ev_expire_reservations` | Done |
| Security (users, GRANT, restricted views) | tagh_app least privilege, read-only reporting user | 2 | | To do |
| Backup and recovery | mysqldump, binary logs, tested restore, point-in-time recovery | 3 | database/backup/ (README.md) | Done |
| Backup copy (CREATE TABLE ... AS SELECT) | Audit log snapshot | 3 | database/queries/member3-audit.sql | Done |
| Query optimization (EXPLAIN) | Before/after plans and timings on 50,000 orders | 10 | docs/performance.md | Done |
| Triggers (auditing) | Price, order, payment, stock and user changes written to audit_log | 3 | V301 | Done |
| Triggers with SIGNAL | audit_log is append-only: updates and deletes are refused | 3 | V301 | Done |
| Views with LEFT JOIN | Audit log with user names, including system changes with no user | 3 | V303 `v_audit_log` | Done |
| JSON functions | JSON_OBJECT in the audit triggers, JSON_EXTRACT for old and new prices | 3 | V301, member3-audit.sql | Done |
| Least-privilege user | tagh_backup can read everything but only write backup_history | 3 | database/backup/README.md | Done |
| Recursive CTE (WITH RECURSIVE) | Sample data generator: 600 customers, 40 products, 50,000 orders | 10 | V1001 | Done |
| ROW_NUMBER() | Numbering customers, products and drivers for the generator | 10 | V1001 | Done |
| Composite and covering indexes | (status, created_at, total_amount) and (product_id, quantity, unit_price) | 10 | V1002, docs/performance.md | Done |
| Removing a redundant index | idx_order_items_product replaced by the covering index | 10 | V1002 | Done |
| Multi-table UPDATE with JOIN | Delivery date capacity filled from order counts | 10 | V1001 | Done |
| Triggers with SIGNAL | Refuse overselling, a sale without a reservation, or removing reserved stock | 4 | V401 `tr_stock_movements_apply` | Done |
| Stored procedures (Member 4) | Reserve, release and convert stock; adjust stock with owner approval; record damage, loss and returns | 4 | V401 | Done |
| Transactions with ROLLBACK (EXIT HANDLER) | Adding a product saves the item, product and opening stock together or not at all | 4 | V401 `sp_add_product`, `sp_add_packaging_item` | Done |
| Functions (Member 4) | Available stock, owner-approval limit | 4 | V401 `fn_available_stock`, `fn_adjustment_approval_limit` | Done |
| Views (Member 4) | Stock levels, low stock, movement history with names (LEFT JOIN), reservations | 4 | V401 | Done |
| LEFT / RIGHT JOIN (Member 4) | Products with no movements; every category with its units in stock | 4 | database/queries/member4-inventory.sql | Done |

> **Note from Member 4:** since V401, every row inserted into `stock_movements` changes
> `stock_items` (and is refused if the stock isn't there). To run Member 10's sample data
> generator, switch that off for your session first:
> `SET @skip_stock_sync = 1; CALL sp_generate_sample_data(50000); SET @skip_stock_sync = NULL;`
