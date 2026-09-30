import bcrypt from "bcrypt";
import pool from "../db/database.js";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}
// The `registerUser` function is responsible for registering a new user in the system. It takes an object containing the user's name, email, and password as input. The function first normalizes the email by trimming whitespace and converting it to lowercase. It then checks if a user with the same email already exists in the database. If so, it throws an error indicating that the email is already in use.
export const registerUser = async ({
  name,
  email,
  password
}: RegisterInput) => {
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await pool.query(
    "SELECT id FROM users WHERE LOWER(email) = $1",
    [normalizedEmail]
  );

  if (existingUser.rows.length > 0) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, created_at`,
    [name.trim(), normalizedEmail, passwordHash]
  );

  return result.rows[0];
};

// hashing the password is a crucial step in ensuring that user credentials are stored securely. By using bcrypt, we can create a hashed version of the password that is difficult to reverse-engineer, protecting user data even if the database is compromised.
export const loginUser = async ({
  email,
  password
}: {
  email: string;
  password: string;
}) => {
  const normalizedEmail = email.trim().toLowerCase();

  const result = await pool.query(
    `SELECT id, name, email, password_hash
     FROM users
     WHERE LOWER(email) = $1`,
    [normalizedEmail]
  );

  if (result.rows.length === 0) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const user = result.rows[0];

  const passwordMatch = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!passwordMatch) {
    throw new Error("INVALID_CREDENTIALS");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email
  };
};
