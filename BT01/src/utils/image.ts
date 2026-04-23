export const DEFAULT_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&w=800&q=80";

export const getProductImage = (image?: string | null): string =>
  image && image.trim().length > 0 ? image : DEFAULT_PRODUCT_IMAGE;
