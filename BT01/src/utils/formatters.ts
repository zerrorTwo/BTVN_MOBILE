/**
 * Format a number as Vietnamese currency (VND)
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

/**
 * Format sold count with k suffix for thousands
 */
export const formatSold = (sold: number): string => {
  if (sold >= 1000) {
    return `${(sold / 1000).toFixed(1)}k đã bán`;
  }
  return `${sold} đã bán`;
};

/**
 * Get initials from a name (max 2 letters)
 */
export const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};
