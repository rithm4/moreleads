import { Router } from 'express';
import sql from '../db.js';

const router = Router();

// GET — health check (Tilda also does GET to verify endpoint)
router.get('/tilda', (req, res) => {
  res.status(200).send('ok');
});

router.post('/tilda', async (req, res) => {
  // Tilda verification request: sends test=test on webhook connect
  // Must respond 200 OK immediately
  if (req.body && req.body.test === 'test') {
    return res.status(200).send('ok');
  }

  // Optional secret validation
  const secret = process.env.TILDA_WEBHOOK_SECRET;
  if (secret && req.query.secret !== secret) {
    return res.status(401).send('Unauthorized');
  }

  const data = req.body || {};

  // Tilda field names (first letter uppercase by default)
  const name =
    data.Name || data.name ||
    [data.Fname, data.Lname].filter(Boolean).join(' ') ||
    'Lead Tilda';

  const email = data.Email || data.email || null;
  const phone = data.Phone || data.phone || null;
  const comment = data.Comment || data.comment || data.Message || data.message || null;

  // Tilda meta: tranid = Lead ID, formid = Block ID
  const tranid = data.tranid || null;
  const formid = data.formid || null;

  // UTM from COOKIES field (if enabled in Tilda webhook settings)
  let utmInfo = null;
  if (data.COOKIES) {
    try {
      const decoded = decodeURIComponent(data.COOKIES);
      const utmMatch = decoded.match(/TILDAUTM=([^;]+)/);
      if (utmMatch) {
        utmInfo = decodeURIComponent(utmMatch[1]).replace(/\|\|\|/g, ' | ');
      }
    } catch (_) {}
  }

  // Build deal title
  const dealTitle = name !== 'Lead Tilda'
    ? `${name}${phone ? ` • ${phone}` : ''}`
    : `Lead Tilda${tranid ? ` #${tranid}` : ''}`;

  // Build notes from all fields
  const noteLines = [];
  if (email) noteLines.push(`Email: ${email}`);
  if (phone) noteLines.push(`Telefon: ${phone}`);
  if (comment) noteLines.push(`Mesaj: ${comment}`);
  if (tranid) noteLines.push(`Lead ID (Tilda): ${tranid}`);
  if (formid) noteLines.push(`Form ID: ${formid}`);
  if (utmInfo) noteLines.push(`UTM: ${utmInfo}`);

  // Any extra custom fields from the form
  const systemKeys = new Set([
    'Name','name','Fname','Lname','Email','email',
    'Phone','phone','Comment','comment','Message','message',
    'tranid','formid','COOKIES','test'
  ]);
  for (const [key, val] of Object.entries(data)) {
    if (!systemKeys.has(key) && val && typeof val === 'string' && val.trim()) {
      noteLines.push(`${key}: ${decodeURIComponent(val)}`);
    }
  }

  const notes = noteLines.join('\n') || null;

  try {
    // Create or find contact
    let contactId = null;
    if (email || phone) {
      let existing = [];
      if (email) {
        existing = await sql`SELECT id FROM contacts WHERE email = ${email} LIMIT 1`;
      }
      if (!existing.length && phone) {
        existing = await sql`SELECT id FROM contacts WHERE phone = ${phone} LIMIT 1`;
      }

      if (existing.length) {
        contactId = existing[0].id;
      } else {
        const newContact = await sql`
          INSERT INTO contacts (name, email, phone, status, notes)
          VALUES (${name}, ${email}, ${phone}, 'new', ${notes})
          RETURNING id
        `;
        contactId = newContact[0].id;
      }
    }

    // Insert deal in 'lead' stage
    const maxPos = await sql`SELECT MAX(position) as m FROM deals WHERE stage='lead'`;
    const position = (maxPos[0].m ?? -1) + 1;

    const deal = await sql`
      INSERT INTO deals (title, stage, position, contact_id, notes, value)
      VALUES (${dealTitle}, 'lead', ${position}, ${contactId}, ${notes}, 0)
      RETURNING id, title, stage
    `;

    console.log('[Tilda] Lead created:', deal[0].id, dealTitle);
    res.status(200).send('ok');
  } catch (err) {
    console.error('[Tilda] Error:', err);
    res.status(500).send('error');
  }
});

export default router;
