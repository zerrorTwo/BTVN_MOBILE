import sequelize from "../config/database";
import User from "./user.model";
import { Product, Category } from "./product.model";
import Brand from "./brand.model";
import Cart from "./cart.model";
import CartItem from "./cart-item.model";
import Order from "./order.model";
import OrderItem from "./order-item.model";
import Coupon from "./coupon.model";
import Review from "./review.model";
import Payment from "./payment.model";

User.hasOne(Cart, { foreignKey: "userId", as: "cart" });
Cart.belongsTo(User, { foreignKey: "userId", as: "user" });

Cart.hasMany(CartItem, { foreignKey: "cartId", as: "items" });
CartItem.belongsTo(Cart, { foreignKey: "cartId", as: "cart" });

CartItem.belongsTo(Product, { foreignKey: "productId", as: "product" });
Product.hasMany(CartItem, { foreignKey: "productId", as: "cartItems" });

User.hasMany(Order, { foreignKey: "userId", as: "orders" });
Order.belongsTo(User, { foreignKey: "userId", as: "user" });

Order.hasMany(OrderItem, { foreignKey: "orderId", as: "items" });
OrderItem.belongsTo(Order, { foreignKey: "orderId", as: "order" });

OrderItem.belongsTo(Product, { foreignKey: "productId", as: "product" });
Product.hasMany(OrderItem, { foreignKey: "productId", as: "orderItems" });

Order.hasMany(Payment, { foreignKey: "orderId", as: "payments" });
Payment.belongsTo(Order, { foreignKey: "orderId", as: "order" });
User.hasMany(Review, { foreignKey: "userId", as: "reviews" });
Review.belongsTo(User, { foreignKey: "userId", as: "user" });
Product.hasMany(Review, { foreignKey: "productId", as: "reviews" });
Review.belongsTo(Product, { foreignKey: "productId", as: "product" });

Brand.hasMany(Product, { foreignKey: "brandId", as: "products" });
Product.belongsTo(Brand, { foreignKey: "brandId", as: "brand" });

Category.hasMany(Category, { foreignKey: "parentId", as: "subCategories" });
Category.belongsTo(Category, { foreignKey: "parentId", as: "parentCategory" });

export { User, Product, Category, Brand, Cart, CartItem, Order, OrderItem, Coupon, Review, Payment };

export default sequelize;
