// Member 4 – the cart the shop pages add to, kept in this browser.
// Member 5 (cart and checkout) reads it with getCart(). Each line: { productId, name, price, imageUrl, qty }.
// It only remembers choices; stock is held for real when checkout calls sp_reserve_stock.
const KEY = "cart";

export function getCart() {
  try {
    const lines = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(lines) ? lines : [];
  } catch {
    return [];
  }
}

export function saveCart(lines) {
  try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* storage full or blocked */ }
}

// adds qty of a product; returns the new quantity of that product in the cart
export function addToCart(product, qty) {
  const lines = getCart();
  const line = lines.find((l) => l.productId === product.item_id);
  if (line) line.qty += qty;
  else lines.push({ productId: product.item_id, name: product.name, price: Number(product.price), imageUrl: product.image_url, qty });
  saveCart(lines);
  return (line || lines[lines.length - 1]).qty;
}

export const cartCount = () => getCart().reduce((n, l) => n + l.qty, 0);
