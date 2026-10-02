import pool from "../db/database.js";
import { Role } from "../types/role.js";

interface AddMemberInput {
  organizationId: string;
  email: string;
  role: Role;
}

interface ChangeMemberRoleInput {
  organizationId: string;
  userId: string;
  newRole: Role;
}

interface RemoveMemberInput {
  organizationId: string;
  userId: string;
  requesterId: string;
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

export const changeMemberRole = async ({
  organizationId,
  userId,
  newRole
}: ChangeMemberRoleInput) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const memberResult = await client.query(
      `SELECT id, role
       FROM organization_members
       WHERE organization_id = $1
       AND user_id = $2
       FOR UPDATE`,
      [organizationId, userId]
    );

    if (memberResult.rows.length === 0) {
      throw new Error("MEMBER_NOT_FOUND");
    }

    const currentRole = memberResult.rows[0].role as Role;

    if (currentRole === newRole) {
      throw new Error("SAME_ROLE");
    }

    /*
     * Prevent the organization from having zero ADMIN users.
     */
    if (currentRole === "ADMIN" && newRole !== "ADMIN") {
      const adminCountResult = await client.query(
        `SELECT COUNT(*)::int AS count
         FROM organization_members
         WHERE organization_id = $1
         AND role = 'ADMIN'`,
        [organizationId]
      );

      const adminCount = adminCountResult.rows[0].count;

      if (adminCount <= 1) {
        throw new Error("LAST_ADMIN");
      }
    }

    const result = await client.query(
      `UPDATE organization_members
       SET role = $1
       WHERE organization_id = $2
       AND user_id = $3
       RETURNING id, organization_id, user_id, role, joined_at`,
      [newRole, organizationId, userId]
    );

    await client.query("COMMIT");

    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const removeMember = async ({
  organizationId,
  userId,
  requesterId
}: RemoveMemberInput) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (userId === requesterId) {
      throw new Error("CANNOT_REMOVE_SELF");
    }

    const memberResult = await client.query(
      `SELECT id, role
       FROM organization_members
       WHERE organization_id = $1
       AND user_id = $2
       FOR UPDATE`,
      [organizationId, userId]
    );

    if (memberResult.rows.length === 0) {
      throw new Error("MEMBER_NOT_FOUND");
    }

    const memberRole = memberResult.rows[0].role as Role;

    /*
     * Prevent removing the final ADMIN.
     */
    if (memberRole === "ADMIN") {
      const adminCountResult = await client.query(
        `SELECT COUNT(*)::int AS count
         FROM organization_members
         WHERE organization_id = $1
         AND role = 'ADMIN'`,
        [organizationId]
      );

      const adminCount = adminCountResult.rows[0].count;

      if (adminCount <= 1) {
        throw new Error("LAST_ADMIN");
      }
    }

    const result = await client.query(
      `DELETE FROM organization_members
       WHERE organization_id = $1
       AND user_id = $2
       RETURNING id, organization_id, user_id, role`,
      [organizationId, userId]
    );

    await client.query("COMMIT");

    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};