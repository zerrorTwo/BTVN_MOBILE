import { Product, Category } from "../models/product.model";

/**
 * Seed sample data for products and categories
 */
export const seedProducts = async (): Promise<void> => {
  try {
    // Check if data already exists
    const categoryCount = await Category.count();
    if (categoryCount > 0) {
      console.log("📦 Sample data already exists, skipping seed...");
      return;
    }

    console.log("🌱 Seeding sample data...");

    // Create categories
    const categories = await Category.bulkCreate([
      {
        name: "Điện thoại",
        description: "Điện thoại di động các loại",
        image: "https://via.placeholder.com/200?text=Phone",
      },
      {
        name: "Laptop",
        description: "Máy tính xách tay",
        image: "https://via.placeholder.com/200?text=Laptop",
      },
      {
        name: "Thời trang",
        description: "Quần áo, giày dép",
        image: "https://via.placeholder.com/200?text=Fashion",
      },
      {
        name: "Đồ gia dụng",
        description: "Đồ dùng trong nhà",
        image: "https://via.placeholder.com/200?text=Home",
      },
      {
        name: "Thể thao",
        description: "Dụng cụ thể thao",
        image: "https://via.placeholder.com/200?text=Sport",
      },
    ]);

    // Create sample products
    const sampleProducts = [
      // Phones
      {
        name: "iPhone 15 Pro Max 256GB",
        description: "Chip A17 Pro, Camera 48MP, Titanium Design",
        price: 29990000,
        originalPrice: 34990000,
        image: "https://via.placeholder.com/400?text=iPhone+15",
        categoryId: categories[0].id,
        stock: 50,
        sold: 120,
        rating: 4.8,
        ratingCount: 256,
      },
      {
        name: "Samsung Galaxy S24 Ultra",
        description: "Snapdragon 8 Gen 3, Camera 200MP, S Pen",
        price: 25990000,
        originalPrice: 28990000,
        image: "https://via.placeholder.com/400?text=S24+Ultra",
        categoryId: categories[0].id,
        stock: 35,
        sold: 89,
        rating: 4.7,
        ratingCount: 189,
      },
      {
        name: "Xiaomi 14 Ultra",
        description: "Leica Camera, Snapdragon 8 Gen 3",
        price: 19990000,
        originalPrice: 23990000,
        image: "https://via.placeholder.com/400?text=Xiaomi+14",
        categoryId: categories[0].id,
        stock: 40,
        sold: 67,
        rating: 4.5,
        ratingCount: 145,
      },
      // Laptops
      {
        name: "MacBook Pro 14 M3 Pro",
        description: "Chip M3 Pro, 18GB RAM, 512GB SSD",
        price: 49990000,
        originalPrice: 54990000,
        image: "https://via.placeholder.com/400?text=MacBook+Pro",
        categoryId: categories[1].id,
        stock: 20,
        sold: 45,
        rating: 4.9,
        ratingCount: 98,
      },
      {
        name: "ASUS ROG Strix G16",
        description: "Intel i9, RTX 4070, 16GB RAM",
        price: 39990000,
        originalPrice: null,
        image: "https://via.placeholder.com/400?text=ASUS+ROG",
        categoryId: categories[1].id,
        stock: 15,
        sold: 32,
        rating: 4.6,
        ratingCount: 76,
      },
      // Fashion
      {
        name: "Áo Polo Nike Dri-FIT",
        description: "Chất liệu thoáng mát, phù hợp thể thao",
        price: 890000,
        originalPrice: 1290000,
        image: "https://via.placeholder.com/400?text=Nike+Polo",
        categoryId: categories[2].id,
        stock: 100,
        sold: 234,
        rating: 4.4,
        ratingCount: 312,
      },
      {
        name: "Giày Adidas Ultraboost",
        description: "Đệm Boost siêu êm, phù hợp chạy bộ",
        price: 3590000,
        originalPrice: 4500000,
        image: "https://via.placeholder.com/400?text=Adidas+Ultraboost",
        categoryId: categories[2].id,
        stock: 60,
        sold: 178,
        rating: 4.7,
        ratingCount: 267,
      },
      // Home
      {
        name: "Nồi chiên không dầu Philips 7L",
        description: "Công suất 2000W, dung tích lớn",
        price: 2990000,
        originalPrice: 3990000,
        image: "https://via.placeholder.com/400?text=Philips+Airfryer",
        categoryId: categories[3].id,
        stock: 80,
        sold: 456,
        rating: 4.6,
        ratingCount: 523,
      },
      {
        name: "Robot hút bụi Xiaomi",
        description: "Tự động làm sạch, điều khiển qua app",
        price: 5990000,
        originalPrice: 7990000,
        image: "https://via.placeholder.com/400?text=Xiaomi+Robot",
        categoryId: categories[3].id,
        stock: 40,
        sold: 123,
        rating: 4.5,
        ratingCount: 189,
      },
      // Sports
      {
        name: "Vợt cầu lông Yonex Astrox 99",
        description: "Dành cho người chơi chuyên nghiệp",
        price: 3890000,
        originalPrice: null,
        image: "https://via.placeholder.com/400?text=Yonex+Astrox",
        categoryId: categories[4].id,
        stock: 25,
        sold: 67,
        rating: 4.8,
        ratingCount: 89,
      },
    ];

    await Product.bulkCreate(sampleProducts);

    console.log("✅ Sample data seeded successfully!");
    console.log(`   - ${categories.length} categories`);
    console.log(`   - ${sampleProducts.length} products`);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
  }
};

export default seedProducts;
