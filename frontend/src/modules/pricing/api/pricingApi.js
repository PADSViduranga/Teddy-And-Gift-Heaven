import client from "../../../shared/api/client";

export async function getProducts() {
  const response = await client.get("/pricing/products");
  return response.data;
}

export async function updateProductPrice(productId, basePrice) {
  const response = await client.patch(`/pricing/products/${productId}/price`, { basePrice });
  return response.data;
}

export async function getPersonalizationOptions(includeInactive = true) {
  const response = await client.get("/pricing/personalization-options", {
    params: { includeInactive },
  });
  return response.data;
}

export async function createPersonalizationOption(payload) {
  const response = await client.post("/pricing/personalization-options", payload);
  return response.data;
}

export async function updatePersonalizationOption(optionId, payload) {
  const response = await client.put(`/pricing/personalization-options/${optionId}`, payload);
  return response.data;
}

export async function updatePersonalizationOptionStatus(optionId, active) {
  const response = await client.patch(
    `/pricing/personalization-options/${optionId}/status`,
    null,
    { params: { active } },
  );
  return response.data;
}

export async function getQuote(payload) {
  const response = await client.post("/pricing/quotes", payload);
  return response.data;
}
