import { authDB } from "./db";

// Retrieves all Admin and Owner user IDs for group notifications.
export async function getAdminsAndOwner(): Promise<number[]> {
  const users = await authDB.queryAll<{ id: number }>`
    SELECT id FROM users WHERE role = 'Admin' OR role = 'Owner'
  `;
  return users.map(u => u.id);
}
