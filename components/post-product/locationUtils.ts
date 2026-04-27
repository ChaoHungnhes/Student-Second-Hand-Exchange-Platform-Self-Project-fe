export type CityOption = "Hà Nội" | "Hồ Chí Minh";

export const cityToApiValue = (city: CityOption) =>
  city === "Hà Nội" ? "Ha Noi" : "Ho Chi Minh";

export const normalizeCity = (city?: string): CityOption => {
  const normalized = (city || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return normalized.includes("ho chi minh") ? "Hồ Chí Minh" : "Hà Nội";
};

export const getCityCenter = (city: CityOption): [number, number] =>
  city === "Hồ Chí Minh" ? [10.7769, 106.7009] : [21.0285, 105.8542];
