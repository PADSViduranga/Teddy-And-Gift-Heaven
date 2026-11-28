package com.teddygiftheaven.backend.inventory.repository;

import java.sql.CallableStatement;
import java.sql.Types;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import com.teddygiftheaven.backend.inventory.dto.AdjustmentRequest;
import com.teddygiftheaven.backend.inventory.dto.LossRequest;
import com.teddygiftheaven.backend.inventory.dto.PackagingRequest;
import com.teddygiftheaven.backend.inventory.dto.ProductRequest;
import com.teddygiftheaven.backend.inventory.dto.ProductUpdateRequest;

// Member 4 (Inventory). All SQL for the inventory pages lives here.
// The business rules are NOT repeated in Java: stock only changes through the V401 procedures,
// and the trigger tr_stock_movements_apply refuses anything that would oversell.
// User input is always passed as a :parameter, never glued into the SQL (stops SQL injection).
@Repository
public class InventoryRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public InventoryRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // ---------- who is logged in ----------

    // Until Member 2's JWT login is merged, the login name is looked up as an email.
    // Returns null if there is no such user (the movement is then saved without a user).
    public Long userIdByEmail(String email) {
        try {
            return jdbc.queryForObject("SELECT user_id FROM users WHERE email = :e",
                    new MapSqlParameterSource("e", email), Long.class);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    // ---------- summary (stat cards on the inventory pages) ----------

    public Map<String, Object> summary() {
        return jdbc.getJdbcTemplate().queryForMap("""
                SELECT SUM(item_kind = 'PRODUCT')                          AS products,
                       SUM(item_kind = 'PRODUCT' AND is_active)            AS active_products,
                       SUM(is_low)                                         AS low_items,
                       SUM(qty_available <= 0)                             AS out_of_stock,
                       COALESCE(SUM(qty_on_hand * price), 0)               AS stock_value,
                       (SELECT COUNT(*) FROM stock_reservations WHERE status = 'ACTIVE') AS active_reservations
                FROM v_stock_levels
                """);
    }

    // ---------- categories (page 19) ----------

    // LEFT JOIN so empty categories still show, with 0 products
    public List<Map<String, Object>> categories() {
        return jdbc.getJdbcTemplate().queryForList("""
                SELECT c.category_id, c.name, COUNT(p.item_id) AS product_count
                FROM categories c
                LEFT JOIN products p ON p.category_id = c.category_id
                GROUP BY c.category_id, c.name
                ORDER BY c.name
                """);
    }

    public void addCategory(String name) {
        jdbc.update("INSERT INTO categories (name) VALUES (:n)", new MapSqlParameterSource("n", name.trim()));
    }

    public int renameCategory(int id, String name) {
        return jdbc.update("UPDATE categories SET name = :n WHERE category_id = :id",
                new MapSqlParameterSource("n", name.trim()).addValue("id", id));
    }

    // the foreign key from products refuses this while the category still has products
    public int deleteCategory(int id) {
        return jdbc.update("DELETE FROM categories WHERE category_id = :id", new MapSqlParameterSource("id", id));
    }

    // ---------- products (pages 17 and 18) ----------

    // filter: "low", "out", "inactive" or null for everything
    public List<Map<String, Object>> products(String search, Integer categoryId, String filter) {
        MapSqlParameterSource p = new MapSqlParameterSource();
        List<String> where = new ArrayList<>();
        where.add("item_kind = 'PRODUCT'");
        if (search != null && !search.isBlank()) {
            where.add("name LIKE :search");
            p.addValue("search", "%" + search.trim() + "%");
        }
        if (categoryId != null) {
            where.add("category_id = :cat");
            p.addValue("cat", categoryId);
        }
        if ("low".equals(filter)) where.add("is_low");
        if ("out".equals(filter)) where.add("qty_available <= 0");
        if ("inactive".equals(filter)) where.add("NOT is_active");
        return jdbc.queryForList("SELECT * FROM v_stock_levels WHERE " + String.join(" AND ", where)
                + " ORDER BY name", p);
    }

    public Map<String, Object> product(long id) {
        try {
            return jdbc.queryForMap("""
                    SELECT v.*, p.description, p.image_url
                    FROM v_stock_levels v
                    JOIN products p ON p.item_id = v.item_id
                    WHERE v.item_id = :id
                    """, new MapSqlParameterSource("id", id));
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    // calls sp_add_product, which saves the item, the product and the opening stock in one transaction
    public long addProduct(ProductRequest r, Long userId) {
        Long id = jdbc.getJdbcTemplate().execute((ConnectionCallback<Long>) con -> {
            try (CallableStatement cs = con.prepareCall("{CALL sp_add_product(?, ?, ?, ?, ?, ?, ?, ?, ?)}")) {
                cs.setString(1, r.name());
                cs.setInt(2, r.categoryId());
                cs.setBigDecimal(3, r.price());
                cs.setString(4, r.description());
                cs.setString(5, r.imageUrl());
                cs.setInt(6, r.reorderLevel());
                cs.setInt(7, r.openingQty());
                if (userId == null) cs.setNull(8, Types.BIGINT); else cs.setLong(8, userId);
                cs.registerOutParameter(9, Types.BIGINT);
                cs.execute();
                return cs.getLong(9);
            }
        });
        return id == null ? 0 : id;
    }

    // name and reorder level live in stock_items, the rest in products: two updates, one @Transactional
    public int updateProduct(long id, ProductUpdateRequest r) {
        MapSqlParameterSource p = new MapSqlParameterSource("id", id)
                .addValue("name", r.name().trim())
                .addValue("reorder", r.reorderLevel())
                .addValue("cat", r.categoryId())
                .addValue("desc", r.description())
                .addValue("img", r.imageUrl())
                .addValue("active", r.active());
        int n = jdbc.update("UPDATE stock_items SET name = :name, reorder_level = :reorder "
                + "WHERE item_id = :id AND item_kind = 'PRODUCT'", p);
        if (n == 0) return 0;
        jdbc.update("UPDATE products SET category_id = :cat, description = :desc, image_url = :img, "
                + "is_active = :active WHERE item_id = :id", p);
        return n;
    }

    // ---------- packaging materials (page 22) ----------

    public List<Map<String, Object>> packaging() {
        return jdbc.getJdbcTemplate().queryForList(
                "SELECT * FROM v_stock_levels WHERE item_kind = 'PACKAGING' ORDER BY is_low DESC, name");
    }

    public long addPackaging(PackagingRequest r, Long userId) {
        Long id = jdbc.getJdbcTemplate().execute((ConnectionCallback<Long>) con -> {
            try (CallableStatement cs = con.prepareCall("{CALL sp_add_packaging_item(?, ?, ?, ?, ?, ?)}")) {
                cs.setString(1, r.name());
                cs.setString(2, r.unit());
                cs.setInt(3, r.reorderLevel());
                cs.setInt(4, r.openingQty() == null ? 0 : r.openingQty());
                if (userId == null) cs.setNull(5, Types.BIGINT); else cs.setLong(5, userId);
                cs.registerOutParameter(6, Types.BIGINT);
                cs.execute();
                return cs.getLong(6);
            }
        });
        return id == null ? 0 : id;
    }

    public int updatePackaging(long id, PackagingRequest r) {
        MapSqlParameterSource p = new MapSqlParameterSource("id", id)
                .addValue("name", r.name().trim())
                .addValue("reorder", r.reorderLevel())
                .addValue("unit", r.unit().trim());
        int n = jdbc.update("UPDATE stock_items SET name = :name, reorder_level = :reorder "
                + "WHERE item_id = :id AND item_kind = 'PACKAGING'", p);
        if (n == 0) return 0;
        jdbc.update("UPDATE packaging_items SET unit = :unit WHERE item_id = :id", p);
        return n;
    }

    // ---------- every stock item, for the drop-downs on pages 20 and 21 ----------

    public List<Map<String, Object>> items() {
        return jdbc.getJdbcTemplate().queryForList("""
                SELECT item_id, name, item_kind, unit, qty_on_hand, qty_reserved, qty_available
                FROM v_stock_levels
                ORDER BY item_kind, name
                """);
    }

    // ---------- stock changes (pages 20 and 21) ----------

    public void adjust(AdjustmentRequest r, Long userId) {
        jdbc.update("CALL sp_adjust_stock(:item, :delta, :reason, :user, :approver)",
                new MapSqlParameterSource("item", r.itemId())
                        .addValue("delta", r.qtyDelta())
                        .addValue("reason", r.reason())
                        .addValue("user", userId)
                        .addValue("approver", r.approvedBy()));
    }

    public void recordLoss(LossRequest r, Long userId) {
        jdbc.update("CALL sp_record_loss(:item, :type, :qty, :reason, :user)",
                new MapSqlParameterSource("item", r.itemId())
                        .addValue("type", r.type())
                        .addValue("qty", r.quantity())
                        .addValue("reason", r.reason())
                        .addValue("user", userId));
    }

    // owners for the "approved by" drop-down on page 20
    public List<Map<String, Object>> owners() {
        return jdbc.getJdbcTemplate().queryForList("""
                SELECT user_id, full_name FROM users
                WHERE is_active AND role_id = (SELECT role_id FROM roles WHERE name = 'OWNER')
                ORDER BY full_name
                """);
    }

    public int approvalLimit() {
        Integer n = jdbc.getJdbcTemplate().queryForObject("SELECT fn_adjustment_approval_limit()", Integer.class);
        return n == null ? 0 : n;
    }

    // ---------- movement history (pages 21 and 24) ----------

    private String movementWhere(Long itemId, List<String> types, LocalDate from, LocalDate to,
                                 MapSqlParameterSource p) {
        List<String> where = new ArrayList<>();
        if (itemId != null) { where.add("item_id = :item"); p.addValue("item", itemId); }
        if (types != null && !types.isEmpty()) { where.add("type IN (:types)"); p.addValue("types", types); }
        if (from != null) { where.add("created_at >= :from"); p.addValue("from", from.atStartOfDay()); }
        if (to != null) { where.add("created_at < :to"); p.addValue("to", to.plusDays(1).atStartOfDay()); }
        return where.isEmpty() ? "" : " WHERE " + String.join(" AND ", where);
    }

    public List<Map<String, Object>> movements(Long itemId, List<String> types, LocalDate from, LocalDate to,
                                               int page, int size) {
        MapSqlParameterSource p = new MapSqlParameterSource();
        String sql = "SELECT * FROM v_stock_movements" + movementWhere(itemId, types, from, to, p)
                + " ORDER BY created_at DESC, movement_id DESC LIMIT :size OFFSET :offset";
        p.addValue("size", size).addValue("offset", page * size);
        return jdbc.queryForList(sql, p);
    }

    public long countMovements(Long itemId, List<String> types, LocalDate from, LocalDate to) {
        MapSqlParameterSource p = new MapSqlParameterSource();
        Long n = jdbc.queryForObject("SELECT COUNT(*) FROM v_stock_movements"
                + movementWhere(itemId, types, from, to, p), p, Long.class);
        return n == null ? 0 : n;
    }

    // ---------- low stock (page 23) and reservations (page 25) ----------

    public List<Map<String, Object>> lowStock() {
        return jdbc.getJdbcTemplate().queryForList("SELECT * FROM v_low_stock ORDER BY shortfall DESC, name");
    }

    public List<Map<String, Object>> reservations(String status) {
        if (status == null) {
            return jdbc.getJdbcTemplate().queryForList(
                    "SELECT * FROM v_reservations ORDER BY status = 'ACTIVE' DESC, expires_at DESC LIMIT 200");
        }
        return jdbc.queryForList("SELECT * FROM v_reservations WHERE status = :s ORDER BY expires_at LIMIT 200",
                new MapSqlParameterSource("s", status));
    }

    // ---------- customer shop (pages /shop and /product/:id) ----------

    // Customers see only active products, and only whether something is in stock (not exact counts),
    // except "only N left" when 5 or fewer remain.
    private static final String SHOP_COLUMNS = """
            SELECT v.item_id, v.name, v.category_id, v.category, v.price, p.description, p.image_url,
                   v.qty_available > 0 AS in_stock,
                   CASE WHEN v.qty_available BETWEEN 1 AND 5 THEN v.qty_available END AS only_left
            FROM v_stock_levels v
            JOIN products p ON p.item_id = v.item_id
            """;

    public List<Map<String, Object>> shopProducts(String search, Integer categoryId, String sort) {
        MapSqlParameterSource p = new MapSqlParameterSource();
        List<String> where = new ArrayList<>();
        where.add("v.item_kind = 'PRODUCT'");
        where.add("v.is_active");
        if (search != null && !search.isBlank()) {
            where.add("v.name LIKE :search");
            p.addValue("search", "%" + search.trim() + "%");
        }
        if (categoryId != null) {
            where.add("v.category_id = :cat");
            p.addValue("cat", categoryId);
        }
        // only fixed ORDER BY choices, never text from the user
        String order = switch (sort == null ? "" : sort) {
            case "price_asc" -> "v.price ASC";
            case "price_desc" -> "v.price DESC";
            default -> "in_stock DESC, v.name";
        };
        return jdbc.queryForList(SHOP_COLUMNS + " WHERE " + String.join(" AND ", where) + " ORDER BY " + order, p);
    }

    public Map<String, Object> shopProduct(long id) {
        try {
            return jdbc.queryForMap(SHOP_COLUMNS + " WHERE v.item_id = :id AND v.is_active",
                    new MapSqlParameterSource("id", id));
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }
}
