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
| Indexes | Orders by status and date, stock movements by item and time | 1, 10 | V103, V104, V10xx | In progress |
| INNER JOIN | Order lines with product names | 5 | | To do |
| LEFT JOIN | Products never sold (slow stock), customers with no orders | 4, 10 | | To do |
| RIGHT JOIN | Every category with its product count, including empty ones | 4 | | To do |
| FULL JOIN (LEFT JOIN UNION RIGHT JOIN) | Items sold vs items received this month | 10 | | To do |
| UNION / UNION ALL | Combined activity feed for the audit page | 3 | | To do |
| Subqueries | Items below reorder level, latest supplier price | 4, 9 | | To do |
| GROUP BY, HAVING, aggregates | Monthly sales, drivers with high failure rates | 8, 10 | | To do |
| Date functions | On-time delivery (DATEDIFF), sales by month (DATE_FORMAT) | 8, 10 | | To do |
| Window functions | Best-seller ranking, running sales totals | 10 | | To do |
| Views | Packing queue without prices, driver's own deliveries, reports | 7, 8, 10 | | To do |
| Stored procedures | Place order, confirm payment, assign driver, receive stock | 5, 6, 8, 9 | | To do |
| Functions | Order total, priority score | 5, 6 | | To do |
| Triggers | Stock from movements, low-stock alerts, price history, audit log | 3, 4, 6 | | To do |
| Transactions (COMMIT / ROLLBACK) | Placing an order, receiving a purchase order | 5, 9 | | To do |
| Row locking (FOR UPDATE) | Stopping two customers from buying the last item | 4, 5 | | To do |
| Scheduled events | Expiring unpaid reservations | 4 | | To do |
| Security (users, GRANT, restricted views) | tagh_app least privilege, read-only reporting user | 2 | | To do |
| Backup and recovery | mysqldump, binary logs, tested restore | 3 | | To do |
| Backup copy (CREATE TABLE ... AS SELECT) | Yearly order snapshot | 3 | | To do |
| Query optimization (EXPLAIN) | Before/after timings on 50,000 orders | 10 | docs/performance.md | To do |
