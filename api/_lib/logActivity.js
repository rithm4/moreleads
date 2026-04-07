import sql from './db.js';

export async function logActivity(userId, action, entity, entityId, details) {
  try {
    await sql`
      INSERT INTO activity_log (user_id, action, entity, entity_id, details)
      VALUES (${userId}, ${action}, ${entity}, ${entityId || null}, ${details || null})
    `;
  } catch {} // never break the request
}
