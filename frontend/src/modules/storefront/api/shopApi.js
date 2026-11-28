import client from "../../../shared/api/client";

// Member 4 – customer shop calls (backend: inventory/controller/ShopController.java)
export const getShopCategories = () => client.get("/shop/categories").then((r) => r.data);
export const getShopProducts = (params) => client.get("/shop/products", { params }).then((r) => r.data);
export const getShopProduct = (id) => client.get(`/shop/products/${id}`).then((r) => r.data);
