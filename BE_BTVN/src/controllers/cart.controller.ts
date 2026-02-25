import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { Cart, CartItem, Product } from "../models";

export const getCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    let cart = await Cart.findOne({
      where: { userId },
      include: [
        {
          model: CartItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: [
                "id",
                "name",
                "price",
                "originalPrice",
                "image",
                "stock",
              ],
            },
          ],
        },
      ],
    });

    if (!cart) {
      cart = await Cart.create({ userId });
      res.json({
        success: true,
        data: {
          id: cart.id,
          items: [],
          subtotal: 0,
          itemCount: 0,
        },
      });
      return;
    }

    const items = (cart as any).items || [];
    const formattedItems = items.map((item: any) => ({
      id: item.id,
      quantity: item.quantity,
      product: {
        id: item.product.id,
        name: item.product.name,
        price: parseFloat(item.product.price),
        originalPrice: item.product.originalPrice
          ? parseFloat(item.product.originalPrice)
          : null,
        image: item.product.image,
        stock: item.product.stock,
      },
      itemTotal: item.quantity * parseFloat(item.product.price),
    }));

    const subtotal = formattedItems.reduce(
      (sum: number, item: any) => sum + item.itemTotal,
      0,
    );

    res.json({
      success: true,
      data: {
        id: cart.id,
        items: formattedItems,
        subtotal,
        itemCount: items.length,
      },
    });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get cart",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};

export const addToCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
      return;
    }

    const userId = (req as any).user.id;
    const { productId, quantity } = req.body;

    const product = await Product.findByPk(productId);
    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    if (product.stock < quantity) {
      res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock`,
      });
      return;
    }

    let cart = await Cart.findOne({ where: { userId } });
    if (!cart) {
      cart = await Cart.create({ userId });
    }

    const existingItem = await CartItem.findOne({
      where: { cartId: cart.id, productId },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (product.stock < newQuantity) {
        res.status(400).json({
          success: false,
          message: `Only ${product.stock} items available in stock`,
        });
        return;
      }
      existingItem.quantity = newQuantity;
      await existingItem.save();
    } else {
      await CartItem.create({
        cartId: cart.id,
        productId,
        quantity,
      });
    }

    res.json({
      success: true,
      message: "Product added to cart successfully",
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add product to cart",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};

export const updateCartItem = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
      return;
    }

    const userId = (req as any).user.id;
    const { itemId } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ where: { userId } });
    if (!cart) {
      res.status(404).json({
        success: false,
        message: "Cart not found",
      });
      return;
    }

    const cartItem = await CartItem.findOne({
      where: { id: itemId, cartId: cart.id },
      include: [{ model: Product, as: "product" }],
    });

    if (!cartItem) {
      res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
      return;
    }

    const product = (cartItem as any).product;
    if (product.stock < quantity) {
      res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock`,
      });
      return;
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    res.json({
      success: true,
      message: "Cart item updated successfully",
    });
  } catch (error) {
    console.error("Update cart item error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update cart item",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};

export const removeCartItem = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { itemId } = req.params;

    const cart = await Cart.findOne({ where: { userId } });
    if (!cart) {
      res.status(404).json({
        success: false,
        message: "Cart not found",
      });
      return;
    }

    const cartItem = await CartItem.findOne({
      where: { id: itemId, cartId: cart.id },
    });

    if (!cartItem) {
      res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
      return;
    }

    await cartItem.destroy();

    res.json({
      success: true,
      message: "Cart item removed successfully",
    });
  } catch (error) {
    console.error("Remove cart item error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove cart item",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};

export const clearCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const cart = await Cart.findOne({ where: { userId } });
    if (!cart) {
      res.status(404).json({
        success: false,
        message: "Cart not found",
      });
      return;
    }

    await CartItem.destroy({ where: { cartId: cart.id } });

    res.json({
      success: true,
      message: "Cart cleared successfully",
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear cart",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};
