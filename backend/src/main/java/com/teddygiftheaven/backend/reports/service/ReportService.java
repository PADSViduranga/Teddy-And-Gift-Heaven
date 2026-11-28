package com.teddygiftheaven.backend.reports.service;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

// Pages 58-68 (Member 10). Every report reads a view from V1003, so the SQL stays in the database.
// All queries are fixed; user input is only ever passed as a parameter (?), never joined into SQL.
@Service
public class ReportService {

    private static final String SOLD =
            "('CONFIRMED','PACKING','PACKED','OUT_FOR_DELIVERY','DELIVERED','COMPLETED','FAILED_DELIVERY')";

    private final JdbcTemplate jdbc;

    public ReportService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // ---------- reports (pages 63-68) ----------

    public List<Map<String, Object>> salesDaily(LocalDate from, LocalDate to) {
        return jdbc.queryForList("SELECT * FROM v_sales_daily WHERE sale_date BETWEEN ? AND ? ORDER BY sale_date",
                from, to);
    }

    public List<Map<String, Object>> salesMonthly() {
        return jdbc.queryForList("SELECT * FROM v_sales_monthly ORDER BY sale_month");
    }

    public List<Map<String, Object>> products() {
        return jdbc.queryForList("SELECT * FROM v_product_sales ORDER BY sales_rank, name");
    }

    public List<Map<String, Object>> categories() {
        return jdbc.queryForList("SELECT * FROM v_category_sales ORDER BY revenue DESC");
    }

    public List<Map<String, Object>> seasonal() {
        return jdbc.queryForList("SELECT * FROM v_seasonal_demand ORDER BY season_year, season");
    }

    public List<Map<String, Object>> customers(int limit) {
        return jdbc.queryForList("SELECT * FROM v_customer_report ORDER BY total_spent DESC LIMIT ?", limit);
    }

    public Map<String, Object> customerSummary() {
        return jdbc.queryForMap("""
                SELECT COUNT(*)                            AS customers,
                       SUM(orders > 0)                     AS with_orders,
                       SUM(is_repeat_customer)             AS repeat_customers,
                       ROUND(100 * SUM(is_repeat_customer) / NULLIF(SUM(orders > 0), 0), 1) AS repeat_pct,
                       ROUND(AVG(NULLIF(total_spent, 0)), 2) AS avg_spent
                FROM v_customer_report
                """);
    }

    public List<Map<String, Object>> stockLoss() {
        return jdbc.queryForList("SELECT * FROM v_stock_loss ORDER BY loss_value DESC, name");
    }

    public List<Map<String, Object>> payments(int months) {
        return jdbc.queryForList("""
                SELECT * FROM v_payment_report
                WHERE pay_month >= DATE_FORMAT(CURRENT_DATE - INTERVAL ? MONTH, '%Y-%m')
                ORDER BY pay_month, method, status
                """, months);
    }

    public List<Map<String, Object>> drivers() {
        return jdbc.queryForList("SELECT * FROM v_driver_performance ORDER BY on_time_pct DESC");
    }

    public List<Map<String, Object>> stockFlow() {
        return jdbc.queryForList("SELECT * FROM v_stock_in_out_30d ORDER BY sold_30d DESC");
    }

    // ---------- dashboards (pages 58-62) ----------

    public Map<String, Object> ownerDashboard() {
        Map<String, Object> d = new LinkedHashMap<>(jdbc.queryForMap("SELECT "
                + "(SELECT COUNT(*) FROM orders WHERE created_at >= CURRENT_DATE) AS orders_today, "
                + "(SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE created_at >= CURRENT_DATE AND status IN " + SOLD + ") AS revenue_today, "
                + "(SELECT COUNT(*) FROM orders WHERE status = 'AWAITING_PAYMENT') AS awaiting_payment, "
                + "(SELECT COUNT(*) FROM orders WHERE status IN ('CONFIRMED','PACKING')) AS to_pack, "
                + "(SELECT COUNT(*) FROM orders WHERE status = 'OUT_FOR_DELIVERY') AS out_for_delivery, "
                + "(SELECT COUNT(*) FROM deliveries WHERE status = 'FAILED' AND assigned_at >= CURRENT_DATE - INTERVAL 7 DAY) AS failed_7d, "
                + "(SELECT COUNT(*) FROM v_stock_loss WHERE is_low) AS low_stock"));
        d.put("sales_last_14_days", salesDaily(LocalDate.now().minusDays(13), LocalDate.now()));
        d.put("top_products", jdbc.queryForList(
                "SELECT name, units_sold, revenue FROM v_product_sales ORDER BY sales_rank LIMIT 5"));
        return d;
    }

    public Map<String, Object> orderStaffDashboard() {
        Map<String, Object> d = new LinkedHashMap<>(jdbc.queryForMap("SELECT "
                + "(SELECT COUNT(*) FROM orders WHERE status = 'AWAITING_PAYMENT') AS awaiting_payment, "
                + "(SELECT COUNT(*) FROM payments WHERE status = 'PENDING' AND method = 'BANK_TRANSFER') AS slips_to_check, "
                + "(SELECT COUNT(*) FROM orders WHERE status IN ('AWAITING_PAYMENT','CONFIRMED')) AS still_editable, "
                + "(SELECT COUNT(*) FROM orders WHERE created_at >= CURRENT_DATE) AS orders_today"));
        d.put("oldest_waiting", jdbc.queryForList("""
                SELECT o.order_id, u.full_name AS customer, o.total_amount, o.created_at
                FROM orders o JOIN users u ON u.user_id = o.customer_id
                WHERE o.status = 'AWAITING_PAYMENT'
                ORDER BY o.created_at LIMIT 8
                """));
        return d;
    }

    public Map<String, Object> inventoryDashboard() {
        Map<String, Object> d = new LinkedHashMap<>(jdbc.queryForMap("""
                SELECT SUM(is_low)                          AS low_stock,
                       COALESCE(SUM(stock_value), 0)        AS stock_value,
                       COALESCE(SUM(loss_value), 0)         AS loss_value,
                       (SELECT COUNT(*) FROM stock_reservations WHERE status = 'ACTIVE') AS active_reservations
                FROM v_stock_loss
                """));
        d.put("low_items", jdbc.queryForList("""
                SELECT item_id, name, qty_available, reorder_level FROM v_stock_loss
                WHERE is_low ORDER BY qty_available - reorder_level LIMIT 8
                """));
        d.put("moving_30d", jdbc.queryForList("SELECT * FROM v_stock_in_out_30d ORDER BY sold_30d DESC LIMIT 8"));
        return d;
    }

    public Map<String, Object> packerDashboard() {
        Map<String, Object> d = new LinkedHashMap<>(jdbc.queryForMap("SELECT "
                + "(SELECT COUNT(*) FROM v_packing_queue WHERE status = 'CONFIRMED') AS to_pack, "
                + "(SELECT COUNT(*) FROM v_packing_queue WHERE status = 'PACKING') AS packing_now, "
                + "(SELECT COUNT(*) FROM v_packing_queue WHERE slot_date <= CURRENT_DATE + INTERVAL 1 DAY) AS due_by_tomorrow, "
                + "(SELECT COUNT(*) FROM v_packing_supplies WHERE is_low) AS packaging_low"));
        d.put("next_to_pack", jdbc.queryForList("""
                SELECT order_id, slot_date, priority_score, items
                FROM v_packing_queue
                ORDER BY slot_date, priority_score DESC, order_id LIMIT 8
                """));
        return d;
    }

    public Map<String, Object> driverDashboard(long driverId) {
        Map<String, Object> d = new LinkedHashMap<>();
        d.put("performance", jdbc.queryForList(
                "SELECT delivered, on_time_pct, failed FROM v_driver_performance WHERE staff_id = ?", driverId));
        d.put("today", jdbc.queryForList("""
                SELECT dl.order_id, dl.time_slot, dl.status, r.full_name AS recipient, r.city
                FROM deliveries dl
                JOIN orders o ON o.order_id = dl.order_id
                JOIN delivery_slots s ON s.slot_id = o.slot_id
                JOIN recipients r ON r.recipient_id = o.recipient_id
                WHERE dl.driver_id = ? AND s.slot_date = CURRENT_DATE
                ORDER BY dl.time_slot
                """, driverId));
        return d;
    }
}
