# Team contract (agreed names and rules)

Owner of this file: Member 1. Change it only by pull request, and tell the team.

## 1. Rules for everyone
- Work only on your own `feature/<module>` branch. Pull requests go into `develop`, never `main`.
- Never edit a merged migration. Fix mistakes with a new migration in your own range.
- Migration ranges: M1 V1xx, M2 V2xx, M3 V3xx, M4 V4xx, M5 V5xx, M6 V6xx, M7 V7xx, M8 V8xx, M9 V9xx, M10 V10xx.
- Table and column names are fixed by V101-V104. Ask Member 1 before changing them.
- Names: procedures `sp_...`, functions `fn_...`, triggers `tr_...`, views `v_...`, events `ev_...`, indexes `idx_...`.
- Business rules live in the database (procedures, triggers, constraints). The backend calls them and never repeats them.

## 2. Stock rules (owner: Member 4)
- Quantities in `stock_items` change **only** through rows inserted into `stock_movements` (a trigger applies them). No code updates `qty_on_hand` or `qty_reserved` directly.
- `quantity` is always positive, and the type decides the direction. Only `ADJUSTMENT` may be negative.

| Movement type | qty_on_hand | qty_reserved |
|---|---|---|
| RESERVE | no change | + quantity |
| RELEASE | no change | - quantity |
| SALE (from a reservation) | - quantity | - quantity |
| RECEIPT | + quantity | no change |
| RETURN | + quantity | no change |
| DAMAGE, LOSS | - quantity | no change |
| ADJUSTMENT | + quantity (signed) | no change |

- Available stock = qty_on_hand - qty_reserved. Every order checks available, never on hand.
- Stock rows are locked with `SELECT ... FOR UPDATE` inside the order transaction.
- A trigger creates one OPEN `LOW_STOCK` notification when available <= reorder_level, and resolves it when stock recovers.
- Adjustments above the agreed limit need `approved_by` (owner).

## 3. Order status workflow (owner: Member 7)
Only `sp_change_order_status` changes `orders.status`. Allowed moves:

| From | To |
|---|---|
| AWAITING_PAYMENT | CONFIRMED, EXPIRED, CANCELLED |
| CONFIRMED | PACKING, CANCELLED |
| PACKING | PACKED |
| PACKED | OUT_FOR_DELIVERY |
| OUT_FOR_DELIVERY | DELIVERED, FAILED_DELIVERY |
| FAILED_DELIVERY | OUT_FOR_DELIVERY (rescheduled), CANCELLED |
| DELIVERED | COMPLETED |

Edits to an order (date, message, address) are allowed only while status is AWAITING_PAYMENT or CONFIRMED.

## 4. Procedure and function signatures
Write stubs with these names first, then fill them in.

| Owner | Name | Parameters | Does |
|---|---|---|---|
| M4 | sp_reserve_stock | order_id, product_id, qty, expires_at | Locks stock, checks available, inserts reservation and RESERVE movement |
| M4 | sp_release_reservation | order_id | Releases active reservations (RELEASE movements) |
| M4 | sp_convert_reservation | order_id | Turns reservations into SALE movements |
| M4 | sp_adjust_stock | item_id, qty_delta, reason, user_id, approved_by | ADJUSTMENT movement |
| M4 | sp_record_loss | item_id, type, qty, reason, user_id | DAMAGE, LOSS or RETURN movement |
| M4 | ev_expire_reservations | (event, every minute) | Expires unpaid reservations and orders |
| M5 | sp_place_online_order | customer_id, recipient_id, slot_id, gift_message, items (JSON), payment_method, OUT order_id | One transaction: capacity check, reserve stock, save order, payment row |
| M5 | sp_cancel_order | order_id, user_id, reason | Cancels and releases or restores stock |
| M5 | fn_priority_score | slot_date, personalization_minutes | Returns an integer, higher means more urgent |
| M6 | fn_order_total | order_id | Items + personalization - discounts |
| M6 | sp_confirm_payment | payment_id, user_id | Confirms payment, converts reservation, sets order CONFIRMED |
| M6 | sp_reject_payment | payment_id, user_id, reason | Rejects the payment |
| M7 | sp_change_order_status | order_id, new_status, user_id | Checks the workflow table above |
| M8 | sp_assign_driver | order_id, driver_id, time_slot | Creates the delivery, status OUT_FOR_DELIVERY |
| M8 | sp_confirm_delivery | order_id, driver_id, cash_collected | DELIVERED, then COMPLETED |
| M8 | sp_fail_delivery | order_id, driver_id, reason | FAILED_DELIVERY |
| M9 | sp_create_purchase_order | supplier_id, user_id | Draft purchase order |
| M9 | sp_receive_purchase_order | po_id, item_id, received_qty, user_id | RECEIPT movement, updates received_qty, flags short delivery |
| M3 | tr_<table>_audit_* | triggers on price, stock, order and payment tables | Write old and new values to `audit_log` |

## 5. Who is acting
The backend sets `@app_user_id` on the database connection before every call. Triggers and procedures read it for `created_by`, `changed_by` and the audit log. Member 2 builds this.

## 6. Roles
OWNER, ORDER_STAFF, INVENTORY_MANAGER, PACKER, DRIVER, CUSTOMER. A visitor sees only the landing page. Every other page and API needs a login.
