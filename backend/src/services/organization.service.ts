import pool from "../db/database.js";

interface CreateOrganizationInput {
  name: string;
  userId: string;
}

export const createOrganization = async ({
  name,
  userId
}: CreateOrganizationInput) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const organizationResult = await client.query(
      `INSERT INTO organizations (name, created_by)
       VALUES ($1, $2)
       RETURNING id, name, created_by, created_at`,
      [name.trim(), userId]
    );

    const organization = organizationResult.rows[0];

    await client.query(
      `INSERT INTO organization_members
       (organization_id, user_id, role)
       VALUES ($1, $2, $3)`,
      [organization.id, userId, "ADMIN"]
    );

    await client.query("COMMIT");

    return organization;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};