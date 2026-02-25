import sequelize from "../config/database";
import User from "./user.model";
import { Product, Category } from "./product.model";
import Cart from "./cart.model";
import CartItem from "./cart-item.model";
import Order from "./order.model";
import OrderItem from "./order-item.model";

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

export { User, Product, Category, Cart, CartItem, Order, OrderItem };

export default sequelize;
