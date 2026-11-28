# Team contract

Hi all, this is the agreement we're working by for Teddy and Gift Heaven. Please read it once
before you start, and come back to it when you're unsure about something. If you think a rule
should change, tell me (Member 1) and we'll update it through a pull request so everyone sees it.

## Getting set up

Everyone runs the project on their own machine. The full step-by-step version is in `docs/setup-guide.md`. You'll need MySQL 8, Java 25 and Node 18 or newer.

Create a database called `teddy_and_gift_heaven` and two MySQL users:
`tagh_migrate`, which Flyway uses to build the tables, and `tagh_app`, which the running app uses.
The app user only gets SELECT, INSERT, UPDATE, DELETE and EXECUTE, on purpose, since that's part of
what we show for database security. Pick your own passwords and put them in
`backend/src/main/resources/application-local.properties`. That file is in .gitignore, so it never
gets pushed. Please double-check `git status` before you commit anyway.

To run things:

- Backend: `cd backend` then `./mvnw spring-boot:run -Dspring-boot.run.profiles=local`
- Frontend: `cd frontend`, `npm install` the first time, then `npm run dev`

If you use VS Code and see a pile of red errors in the .sql files, that's the SQL Server (mssql)
extension reading our MySQL as Microsoft SQL. Disable it for this workspace and they go away.

## How we use Git

`main` is only for the final launch. Nobody pushes to it, and I'll merge `develop` into it at the
end. `develop` is where everything comes together. Each of us has our own feature branch, and
that's the only branch you should be committing to.

Start each work session with `git pull origin develop` on your branch so you're not building on
old code. When something is ready, open a pull request into `develop` (never `main`) and ask
someone to approve it. Small, frequent pull requests are much easier to review than one huge one
at the end. Start commit messages with `feat:`, `fix:`, `docs:`, `test:` or `chore:` so the
history is easy to read.

## Who works where

Stay inside your own folders. That's what keeps us from overwriting each other's work.

| Member | Branch | Backend package | Frontend folder | Migration numbers |
|---|---|---|---|---|
| 1 | feature/database-schema | common, config | shared, storefront (landing) | V1xx |
| 2 | feature/security-access | security | modules/auth | V2xx |
| 3 | feature/backup-devops | audit | modules/audit | V3xx |
| 4 | feature/inventory | inventory | modules/inventory, storefront (shop) | V4xx |
| 5 | feature/orders | orders | modules/orders | V5xx |
| 6 | feature/personalization-pricing | pricing | modules/pricing | V6xx |
| 7 | feature/packing-status | packing | modules/packing | V7xx |
| 8 | feature/delivery | delivery | modules/delivery | V8xx |
| 9 | feature/suppliers | suppliers | modules/suppliers | V9xx |
| 10 | feature/reports-optimization | reports | modules/reports | V10xx |

Backend code lives under `com.teddygiftheaven.backend`, and migrations go in
`backend/src/main/resources/db/migration`.

## Working with the database

All 29 tables are already created in V101 to V104. Please don't edit those files, or any migration
once it's merged. Flyway remembers each file's fingerprint, and changing one breaks everyone's
setup. If you need a new column or table, write a new migration in your own number range. If it
touches a table someone else uses, check with me first.

Most of our marks are for the database work, so the business rules belong in MySQL: procedures,
triggers, functions, views and constraints. The Java code should call them, not repeat the logic.
Name things so we can tell them apart at a glance: `sp_` for procedures, `fn_` for functions,
`tr_` for triggers, `v_` for views, `ev_` for events and `idx_` for indexes. Put a short comment at
the top of each one saying which syllabus topic it shows (joins, transactions and so on). It makes
writing the report much easier later.

The backend will set `@app_user_id` on the database connection before each call, so triggers and
procedures know who did what. Member 2 is setting that up.

## Stock

Member 4 owns this, but everyone touches it, so it needs to work the same way for all of us.

Nobody updates `qty_on_hand` or `qty_reserved` directly. Instead you insert a row into
`stock_movements`, and a trigger adjusts the numbers. That way every change is logged and the
totals always add up. Quantities are positive and the movement type decides the direction. The
only exception is ADJUSTMENT, which can be negative.

| Movement | On hand | Reserved |
|---|---|---|
| RESERVE | no change | goes up |
| RELEASE | no change | goes down |
| SALE (from a reservation) | goes down | goes down |
| RECEIPT, RETURN | goes up | no change |
| DAMAGE, LOSS | goes down | no change |
| ADJUSTMENT | up or down | no change |

When you check whether something can be sold, use available stock (on hand minus reserved), never
on hand. Lock the stock rows with `SELECT ... FOR UPDATE` inside your transaction so two customers
can't buy the last teddy at the same time. When available stock drops to the reorder level, a
single low-stock notification is created, and it closes itself once stock comes back. Big manual
adjustments need the owner's approval (we still need to agree the limit with the shop owner).

## Order statuses

Member 7 owns the status rules, and only `sp_change_order_status` is allowed to change an order's
status. These are the only moves it accepts:

| From | Can go to |
|---|---|
| AWAITING_PAYMENT | CONFIRMED, EXPIRED, CANCELLED |
| CONFIRMED | PACKING, CANCELLED |
| PACKING | PACKED |
| PACKED | OUT_FOR_DELIVERY |
| OUT_FOR_DELIVERY | DELIVERED, FAILED_DELIVERY |
| FAILED_DELIVERY | OUT_FOR_DELIVERY (rescheduled), CANCELLED |
| DELIVERED | COMPLETED |

A customer or staff member can only change the date, message or address while the order is
still AWAITING_PAYMENT or CONFIRMED. Once packing starts, it's locked.

## Procedures we call from each other's modules

Several of us depend on each other's procedures, so please create these with exactly these names
and parameters early on, even as empty stubs. That way nobody is stuck waiting.

- **Member 4:** `sp_reserve_stock(order_id, product_id, qty, expires_at)`,
  `sp_release_reservation(order_id)`, `sp_convert_reservation(order_id)`,
  `sp_adjust_stock(item_id, qty_delta, reason, user_id, approved_by)`,
  `sp_record_loss(item_id, type, qty, reason, user_id)`, and the event `ev_expire_reservations`
  that runs every minute.
- **Member 5:** `sp_place_online_order(customer_id, recipient_id, slot_id, gift_message, items_json,
  payment_method, OUT order_id)`, `sp_cancel_order(order_id, user_id, reason)` and
  `fn_priority_score(slot_date, personalization_minutes)`.
- **Member 6:** `fn_order_total(order_id)`, `sp_confirm_payment(payment_id, user_id)` and
  `sp_reject_payment(payment_id, user_id, reason)`.
- **Member 7:** `sp_change_order_status(order_id, new_status, user_id)`.
- **Member 8:** `sp_assign_driver(order_id, driver_id, time_slot)`,
  `sp_confirm_delivery(order_id, driver_id, cash_collected)` and
  `sp_fail_delivery(order_id, driver_id, reason)`.
- **Member 9:** `sp_create_purchase_order(supplier_id, user_id)` and
  `sp_receive_purchase_order(po_id, item_id, received_qty, user_id)`.
- **Member 3:** the audit triggers, named `tr_<table>_audit_<action>`, which write old and new
  values to `audit_log`.

## Roles and logins

We have six roles: owner, order staff, inventory manager, packer, driver and customer. Someone
who isn't logged in only ever sees the landing page. There are three separate logins: customers
use `/login`, staff use `/staff/login`, and the owner uses `/admin/login`.

## Showing the SQL topics

The lecturer wants to see joins (inner, left, right and full), unions, subqueries, grouping,
aggregates, date functions, views, indexes, constraints, procedures, functions, triggers,
transactions and events. Each of you has a list of these in your prompt. Put your demo queries in
`database/queries/` (for example `member5-orders-joins.sql`) and add a line for each one to
`docs/sql-coverage.md`. MySQL has no FULL JOIN, so we write it as a LEFT JOIN, then UNION, then
a RIGHT JOIN.

## Design

Everything visual comes from `frontend/src/index.css`: the nine brand colors, the status colors
and the fonts (Poppins for headings, Nunito for text, Pacifico only for the logo). Please use
those variables and classes instead of typing hex codes or font sizes, so all 69 pages end up
looking like one site. Build each page from its UI image. If something in the design doesn't
fit the rules above, ask before changing it.

Thanks, everyone. Let's keep pull requests small and talk early when something blocks you.

## Adding your pages

The shared layout is ready, so you only build what goes inside it.

Every staff page is already listed in `frontend/src/shared/layout/menus.js`, with its address and
the roles that can open it. Until you build it, it shows a placeholder. To swap in your real page:

1. Build the page in your own folder, for example
   `frontend/src/modules/inventory/pages/ProductListPage.jsx`.
2. Create `routes.jsx` in your module folder (once) and list your pages there:

   ```jsx
   import ProductListPage from "./pages/ProductListPage";
   export default [
     { path: "/staff/products", element: <ProductListPage /> },
   ];
   ```

   The path has to match the one in `menus.js` exactly. The app picks it up by itself, so you
   never need to edit `App.jsx`.
3. Start from the placeholder's layout: `PageHeader` at the top, a row of `StatCard`s if your
   page has numbers, then the `.filters` row and a `.table` inside `.table-wrap`. Forms use
   `.form-grid`, `.field` and `.form-actions`. These live in `frontend/src/shared/components/`.
4. Don't edit `menus.js`, the layout or `index.css` yourself. If you need a new page, a different
   menu name or another role on a page, tell me and I'll change it.

Customer pages (shop, cart, checkout, my orders and so on) work the same way, using the paths
listed in `CUSTOMER_PAGES` in `App.jsx`.

**Testing before the real login exists:** open the browser console (F12) and run
`localStorage.setItem("token","dev"); localStorage.setItem("role","OWNER"); localStorage.setItem("name","Test")`.
Change `OWNER` to `ORDER_STAFF`, `INVENTORY_MANAGER`, `PACKER` or `DRIVER` to see what each role
sees. Run `localStorage.clear()` to log out. Once Member 2's login is merged, use that instead.
