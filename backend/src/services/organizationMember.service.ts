import pool from "../db/database.js";
import { Role } from "../types/role.js";

interface AddMemberInput {
  organizationId: string;
  email: string;
  role: Role;
}

export const addMember = async ({
  organizationId,
  email,
  role
}: AddMemberInput) => {
  const normalizedEmail = email.trim().toLowerCase();

  const userResult = await pool.query(
    `SELECT id, name, email
     FROM users
     WHERE LOWER(email) = $1`,
    [normalizedEmail]
  );

  if (userResult.rows.length === 0) {
    throw new Error("USER_NOT_FOUND");
  }

  const user = userResult.rows[0];

  const existingMember = await pool.query(
    `SELECT id
     FROM organization_members
     WHERE organization_id = $1
     AND user_id = $2`,
    [organizationId, user.id]
  );

  if (existingMember.rows.length > 0) {
    throw new Error("ALREADY_MEMBER");
  }

  const result = await pool.query(
    `INSERT INTO organization_members
     (organization_id, user_id, role)
     VALUES ($1, $2, $3)
     RETURNING id, organization_id, user_id, role, joined_at`,
    [organizationId, user.id, role]
  );

  return {
    membership: result.rows[0],
    user
  };
};