import client from "../../../shared/api/client";

// Member 10's calls (backend: reports/controller/ReportController.java and DashboardController.java)
const get = (url, params) => client.get(url, { params }).then((r) => r.data);

export const getDashboard = (role, params) => get(`/dashboard/${role}`, params);
export const getSalesDaily = (from, to) => get("/reports/sales/daily", { from, to });
export const getSalesMonthly = () => get("/reports/sales/monthly");
export const getProducts = () => get("/reports/products");
export const getCategories = () => get("/reports/categories");
export const getSeasonal = () => get("/reports/seasonal");
export const getCustomers = (limit = 50) => get("/reports/customers", { limit });
export const getCustomerSummary = () => get("/reports/customers/summary");
export const getStockLoss = () => get("/reports/stock-loss");
export const getPayments = (months = 12) => get("/reports/payments", { months });
export const getDrivers = () => get("/reports/drivers");
