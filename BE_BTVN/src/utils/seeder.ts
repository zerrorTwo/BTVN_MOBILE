import fs from "fs/promises";
import path from "path";
import { Product, Category } from "../models/product.model";
import Brand from "../models/brand.model";

interface SourceProduct {
  sku?: string;
  name?: string;
  brand?: string;
  price?: number;
  image?: string;
  description?: string;
  rating?: number;
}

type CategoryCode =
  | "LAPTOP_GAMING"
  | "LAPTOP_MACBOOK"
  | "LAPTOP_ULTRABOOK"
  | "MOUSE"
  | "KEYBOARD"
  | "HEADPHONE"
  | "MOUSEPAD"
  | "CHAIR"
  | "ACCESSORY_OTHER";

const CATEGORY_NAME_BY_CODE: Record<CategoryCode, string> = {
  LAPTOP_GAMING: "Gaming Laptops",
  LAPTOP_MACBOOK: "MacBooks",
  LAPTOP_ULTRABOOK: "Ultrabooks",
  MOUSE: "Mice",
  KEYBOARD: "Keyboards",
  HEADPHONE: "Headphones",
  MOUSEPAD: "Mousepads",
  CHAIR: "Gaming Chairs",
  ACCESSORY_OTHER: "Other Accessories",
};

const BRAND_IMAGE_MAP: Record<string, string> = {
  Apple: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
  Dell: "https://upload.wikimedia.org/wikipedia/commons/1/18/Dell_logo_2016.svg",
  Asus: "https://upload.wikimedia.org/wikipedia/commons/2/2e/ASUS_Logo.svg",
  Acer: "https://upload.wikimedia.org/wikipedia/commons/0/00/Acer_2011.svg",
  Lenovo: "https://upload.wikimedia.org/wikipedia/commons/b/b8/Lenovo_logo_2015.svg",
  HP: "https://upload.wikimedia.org/wikipedia/commons/a/ad/HP_logo_2012.svg",
  MSI: "https://upload.wikimedia.org/wikipedia/commons/9/99/MSI_logo_%282021%29.svg",
  Gigabyte:
    "https://upload.wikimedia.org/wikipedia/commons/8/8d/Gigabyte_Technology_logo.svg",
  Logitech: "https://upload.wikimedia.org/wikipedia/commons/0/0b/Logitech_logo.svg",
  Razer: "https://upload.wikimedia.org/wikipedia/commons/7/76/Razer_logo.svg",
  Corsair: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Corsair_Logo.svg",
};

const CATEGORY_IMAGE_MAP: Record<string, string> = {
  Laptops:
    "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?q=80&w=900&auto=format&fit=crop",
  Accessories:
    "https://images.unsplash.com/photo-1527814050087-3793815479db?q=80&w=900&auto=format&fit=crop",
  "Gaming Laptops":
    "https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=900&auto=format&fit=crop",
  Ultrabooks:
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=900&auto=format&fit=crop",
  MacBooks:
    "https://images.unsplash.com/photo-1517336714460-d150858cd52d?q=80&w=900&auto=format&fit=crop",
  Mice:
    "https://images.unsplash.com/photo-1615663245857-ac1eebc3f972?q=80&w=900&auto=format&fit=crop",
  Keyboards:
    "https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=900&auto=format&fit=crop",
  Headphones:
    "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=900&auto=format&fit=crop",
  Mousepads:
    "https://images.unsplash.com/photo-1613141412501-9012977f1969?q=80&w=900&auto=format&fit=crop",
  "Gaming Chairs":
    "https://images.unsplash.com/photo-1598550476439-6847785fcea6?q=80&w=900&auto=format&fit=crop",
  "Other Accessories":
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=900&auto=format&fit=crop",
};

const normalizeBrandName = (brand: string): string =>
  brand
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\bmsi\b/gi, "MSI")
    .replace(/\bmchose\b/gi, "MCHOSE")
    .replace(/\be-dra\b/gi, "E-Dra");

const randomStock = (): number => Math.floor(Math.random() * 91) + 10; // 10..100
const randomSold = (): number => Math.floor(Math.random() * 1000);
const randomDiscountPercent = (): number => Math.floor(Math.random() * 21) + 5; // 5..25%

const stripHtml = (text: string): string =>
  text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const pickCategoryCode = (
  productName: string,
  source: "laptops" | "accessories",
): CategoryCode => {
  const name = productName.toLowerCase();

  if (source === "laptops") {
    if (name.includes("macbook")) return "LAPTOP_MACBOOK";
    if (
      name.includes("gaming") ||
      name.includes("rog") ||
      name.includes("tuf") ||
      name.includes("legion") ||
      name.includes("nitro") ||
      name.includes("loq") ||
      name.includes("geforce")
    ) {
      return "LAPTOP_GAMING";
    }
    return "LAPTOP_ULTRABOOK";
  }

  if (name.includes("tai nghe") || name.includes("headphone") || name.includes("headset")) {
    return "HEADPHONE";
  }
  if (name.includes("bàn phím") || name.includes("ban phim") || name.includes("keyboard")) {
    return "KEYBOARD";
  }
  if (name.includes("chuột") || name.includes("chuot") || name.includes("mouse")) {
    return "MOUSE";
  }
  if (name.includes("lót chuột") || name.includes("mousepad")) {
    return "MOUSEPAD";
  }
  if (name.includes("ghế") || name.includes("ghe")) {
    return "CHAIR";
  }
  return "ACCESSORY_OTHER";
};

const readProductsFromJson = async (filePath: string): Promise<SourceProduct[]> => {
  const fileText = await fs.readFile(filePath, "utf-8");
  const parsed = JSON.parse(fileText) as SourceProduct[];
  if (!Array.isArray(parsed)) return [];
  return parsed;
};

export const seedProducts = async (): Promise<void> => {
  try {
    const brandCount = await Brand.count();
    if (brandCount > 0) {
      console.log("ℹ️ Data already exists. Skipping seed.");
      return;
    }

    console.log("🌱 Seeding from laptops.json + laptops2.json ...");

    const workspaceRoot = path.resolve(__dirname, "../../../");
    const laptopsPath = path.join(workspaceRoot, "laptops.json");
    const accessoriesPath = path.join(workspaceRoot, "laptops2.json");

    const [laptopsRaw, accessoriesRaw] = await Promise.all([
      readProductsFromJson(laptopsPath),
      readProductsFromJson(accessoriesPath),
    ]);

    const selectedLaptops = laptopsRaw.slice(0, 100);
    const selectedAccessories = accessoriesRaw.slice(0, 100);
    const selectedAll = [
      ...selectedLaptops.map((item) => ({ ...item, __source: "laptops" as const })),
      ...selectedAccessories.map((item) => ({
        ...item,
        __source: "accessories" as const,
      })),
    ];

    // 1) Seed brands by unique names in source data
    const uniqueBrandNames = Array.from(
      new Set(
        selectedAll
          .map((item) => (item.brand ? normalizeBrandName(item.brand) : ""))
          .filter(Boolean),
      ),
    );

    await Brand.bulkCreate(
      uniqueBrandNames.map((name) => ({
        name,
        imageUrl: BRAND_IMAGE_MAP[name] ?? null,
      })),
    );
    const brands = await Brand.findAll();
    const brandIdByName = new Map<string, number>(
      brands.map((brand) => [normalizeBrandName(brand.name), brand.id]),
    );

    // 2) Seed categories
    await Category.bulkCreate([
      {
        name: "Laptops",
        parentId: null,
        image: CATEGORY_IMAGE_MAP["Laptops"],
      },
      {
        name: "Accessories",
        parentId: null,
        image: CATEGORY_IMAGE_MAP["Accessories"],
      },
    ]);
    const roots = await Category.findAll();
    const laptopsRoot = roots.find((c) => c.name === "Laptops");
    const accessoriesRoot = roots.find((c) => c.name === "Accessories");

    if (!laptopsRoot || !accessoriesRoot) {
      throw new Error("Không tạo được category gốc.");
    }

    await Category.bulkCreate([
      {
        name: "Gaming Laptops",
        parentId: laptopsRoot.id,
        image: CATEGORY_IMAGE_MAP["Gaming Laptops"],
      },
      {
        name: "Ultrabooks",
        parentId: laptopsRoot.id,
        image: CATEGORY_IMAGE_MAP["Ultrabooks"],
      },
      {
        name: "MacBooks",
        parentId: laptopsRoot.id,
        image: CATEGORY_IMAGE_MAP["MacBooks"],
      },
      {
        name: "Mice",
        parentId: accessoriesRoot.id,
        image: CATEGORY_IMAGE_MAP["Mice"],
      },
      {
        name: "Keyboards",
        parentId: accessoriesRoot.id,
        image: CATEGORY_IMAGE_MAP["Keyboards"],
      },
      {
        name: "Headphones",
        parentId: accessoriesRoot.id,
        image: CATEGORY_IMAGE_MAP["Headphones"],
      },
      {
        name: "Mousepads",
        parentId: accessoriesRoot.id,
        image: CATEGORY_IMAGE_MAP["Mousepads"],
      },
      {
        name: "Gaming Chairs",
        parentId: accessoriesRoot.id,
        image: CATEGORY_IMAGE_MAP["Gaming Chairs"],
      },
      {
        name: "Other Accessories",
        parentId: accessoriesRoot.id,
        image: CATEGORY_IMAGE_MAP["Other Accessories"],
      },
    ]);

    const categories = await Category.findAll();
    const categoryIdByName = new Map<string, number>(
      categories.map((category) => [category.name, category.id]),
    );

    // 3) Build product payload
    const productMap = new Map<string, any>();
    for (const item of selectedAll) {
      const sku = String(item.sku || "").trim();
      const name = String(item.name || "").trim();
      const brandName = String(item.brand || "").trim();
      const price = Number(item.price || 0);

      if (!sku || !name || !brandName || !price) continue;

      const normalizedBrand = normalizeBrandName(brandName);
      const brandId = brandIdByName.get(normalizedBrand) ?? null;
      const categoryCode = pickCategoryCode(name, item.__source);
      const categoryName = CATEGORY_NAME_BY_CODE[categoryCode];
      const categoryId = categoryIdByName.get(categoryName) ?? null;

      if (!brandId || !categoryId) continue;

      const productPayload = {
        sku,
        name,
        brandId,
        categoryId,
        price,
        originalPrice:
          Math.random() < 0.45
            ? Math.round(price / (1 - randomDiscountPercent() / 100))
            : null,
        image: item.image || null,
        description: stripHtml(item.description || ""),
        rating: Number(item.rating || 0),
        ratingCount: 0,
        stock: randomStock(),
        sold: randomSold(),
        isActive: true,
      };

      // Deduplicate by sku, keep first seen
      if (!productMap.has(sku)) {
        productMap.set(sku, productPayload);
      }
    }

    const productsToCreate = Array.from(productMap.values());
    await Product.bulkCreate(productsToCreate);

    console.log(`✅ Seed thành công ${productsToCreate.length} sản phẩm.`);
    console.log(
      `   - Laptops dùng: ${selectedLaptops.length} (max 100)\n   - Accessories dùng: ${selectedAccessories.length} (max 100)`,
    );
  } catch (error) {
    console.error("❌ Error seeding data:", error);
  }
};

export default seedProducts;
