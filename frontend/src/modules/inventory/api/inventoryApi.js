import client from "../../../shared/api/client";

// Member 4 – every call the inventory pages make (backend: inventory/controller/InventoryController.java)
const get = (url, params) => client.get(url, { params }).then((r) => r.data);

export const getSummary = () => get("/inventory/summary");

// page 19
export const getCategories = () => get("/inventory/categories");
export const addCategory = (name) => client.post("/inventory/categories", { name });
export const renameCategory = (id, name) => client.put(`/inventory/categories/${id}`, { name });
export const deleteCategory = (id) => client.delete(`/inventory/categories/${id}`);

// pages 17 and 18
export const getProducts = (params) => get("/inventory/products", params);
export const getProduct = (id) => get(`/inventory/products/${id}`);
export const addProduct = (body) => client.post("/inventory/products", body).then((r) => r.data);
export const updateProduct = (id, body) => client.put(`/inventory/products/${id}`, body).then((r) => r.data);

// page 22
export const getPackaging = () => get("/inventory/packaging");
export const addPackaging = (body) => client.post("/inventory/packaging", body);
export const updatePackaging = (id, body) => client.put(`/inventory/packaging/${id}`, body);

// pages 20 and 21
export const getItems = () => get("/inventory/items");
export const getOwners = () => get("/inventory/owners");
export const adjustStock = (body) => client.post("/inventory/stock/adjust", body);
export const recordLoss = (body) => client.post("/inventory/stock/losses", body);
export const getLosses = (params) => get("/inventory/stock/losses", params);

// pages 23, 24, 25
export const getLowStock = () => get("/inventory/stock/low");
export const getMovements = (params) => get("/inventory/stock/movements", params);
export const getReservations = (status) => get("/inventory/stock/reservations", status ? { status } : undefined);
