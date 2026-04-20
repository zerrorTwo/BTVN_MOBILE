import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key";
const JWT_EXPIRE = process.env.JWT_EXPIRE || "7d";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || `${JWT_SECRET}-refresh`;
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || "7d";

export const generateToken = (userId: number, expiresIn?: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: (expiresIn || JWT_EXPIRE) as string,
  } as jwt.SignOptions);
};

export const generateAccessToken = (userId: number): string => {
  return generateToken(userId);
};

export const generateRefreshToken = (userId: number): string => {
  return jwt.sign({ userId, type: "refresh" }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRE as string,
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): { userId: number } => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number };
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

export const verifyRefreshToken = (token: string): { userId: number } => {
  try {
    const payload = jwt.verify(token, JWT_REFRESH_SECRET) as {
      userId: number;
      type?: string;
    };
    if (payload.type !== "refresh") {
      throw new Error("Invalid refresh token");
    }

    return { userId: payload.userId };
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
};
