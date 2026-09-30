import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
}

export const generateToken = (userId: string) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET_NOT_CONFIGURED");
  }

  return jwt.sign(
    { userId },
    secret,
    {
      expiresIn: "1d"
    }
  );
};