import { Router } from 'express';
import sql from '../db.js';

const router = Router();

// Tilda sends form data as POST (JSON or URL-encoded)
// Configure this URL in Tilda: Settings → Notifications → Webhook URL
// URL: https://moreleads.vercel.app/api/webhooks/tilda
// Optional secret: add ?secret=YOUR_SECRET and set TILDA_WEBHOOK_SECRET env var

router.get('/tilda', (req, res) => {
  res.json({ ok: true, message: 'Tilda webhook endpoint is live. Use POST to send leads.' });
});

router.post('/tilda', async (req, res) => {
  // Optional secret validation
  const secret = process.env.TILDA_WEBHOOK_SECRET;
  if (secret && req.query.secret !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const data = req.body;

  // Extract common Tilda form fields (field names vary by form design)
  const name =
    data.Name || data.name || data.NAME ||
    data['Nume'] || data['Prenume'] ||
    [data.fname, data.lname].filter(Boolean).join(' ') ||
    'Lead Tilda';

  const email =
    data.Email || data.email || data.EMAIL || data['E-mail'] || null;

  const phone =
    data.Phone || data.phone || data.PHONE ||
    data['Telefon'] || data['Tel'] || null;

  const comment =
    data.Comment || data.comment || data.Message || data.message ||
    data['Mesaj'] || data['Comentariu'] || null;

  // Tilda meta fields
  const formName =
    data['tildaspec:formname'] || data.formname || data['Formular'] || '';
  const pageTitle =
    data['tildaspec:pagename'] || data.pagename || '';

  // Build deal title
  const dealTitle = name !== 'Lead Tilda'
    ? `${name}${phone ? ` • ${phone}` : ''}`
    : `Lead nou${formName ? ` — ${formName}` : ''}${pageTitle ? ` (${pageTitle})` : ''}`;

  // Build deal notes
  const noteLines = [];
  if (email) noteLines.push(`Email: ${email}`);
  if (phone) noteLines.push(`Telefon: ${phone}`);
  if (formName) noteLines.push(`Formular: ${formName}`);
  if (pageTitle) noteLines.push(`Pagina: ${pageTitle}`);
  if (comment) noteLines.push(`Mesaj: ${comment}`);

  // Add any extra fields from the form
  const knownKeys = new Set([
    'Name','name','NAME','Nume','Prenume','fname','lname',
    'Email','email','EMAIL','E-mail',
    'Phone','phone','PHONE','Telefon','Tel',
    'Comment','comment','Message','message','Mesaj','Comentariu',
    'tildaspec:formname','formname','Formular',
    'tildaspec:pagename','pagename',
    'tildaspec:formid','tildaspec:pageid','tildaspec:projectid',
    'tranid','test'
  ]);
  for (const [key, val] of Object.entries(data)) {
    if (!knownKeys.has(key) && val && typeof val === 'string') {
      noteLines.push(`${key}: ${val}`);
    }
  }

  const notes = noteLines.join('\n') || null;

  try {
    // Create contact if we have at least email or phone
    let contactId = null;
    if (email || phone) {
      // Check if contact already exists
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

    // Get next position in 'lead' stage
    const maxPos = await sql`SELECT MAX(position) as m FROM deals WHERE stage='lead'`;
    const position = (maxPos[0].m ?? -1) + 1;

    // Create deal
    const deal = await sql`
      INSERT INTO deals (title, stage, position, contact_id, notes, value)
      VALUES (${dealTitle}, 'lead', ${position}, ${contactId}, ${notes}, 0)
      RETURNING id, title, stage
    `;

    console.log('[Tilda webhook] New lead created:', deal[0].id, dealTitle);
    res.json({ ok: true, deal: deal[0] });
  } catch (err) {
    console.error('[Tilda webhook] Error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

export default router;
