import { createHmac, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Branch } from '@/lib/options';

/**
 * ───────────────────────────────────────────────────────────────────────
 * TODO once we have the real Typeform form in front of us:
 *
 * Every Typeform question has a stable `ref` (shown in the Typeform builder
 * under each question's settings, or via the Typeform API:
 * GET https://api.typeform.com/forms/{form_id}).
 *
 * Fill in FIELD_REF_MAP below with `<your question's ref>: '<our column>'`
 * for every question that should land directly in a column. Anything not
 * listed here is ignored (not an error).
 *
 * ENTITY_FIELD_REF must point at whichever question tells us which branch
 * (Odense / Kopenhag / Aarhus) the signup belongs to — e.g. a hidden field
 * set per-branch landing page, or a visible "Which city?" question.
 * ───────────────────────────────────────────────────────────────────────
 */
const FIELD_REF_MAP: Record<string, string> = {
  // 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx': 'name',
  // 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx': 'phone_number',
  // 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx': 'university_expa',
};

const ENTITY_FIELD_REF: string | null = null; // e.g. 'xxxxxxxx-xxxx-...'
const DEFAULT_ENTITY: Branch = 'MC Denmark';

type TypeformAnswer = {
  field: { ref?: string; type: string };
  type: string;
  text?: string;
  email?: string;
  phone_number?: string;
  number?: number;
  boolean?: boolean;
  date?: string;
  url?: string;
  choice?: { label: string };
  choices?: { labels: string[] };
};

type TypeformPayload = {
  event_type: string;
  form_response: {
    form_id: string;
    submitted_at: string;
    answers: TypeformAnswer[];
  };
};

function answerValue(answer: TypeformAnswer): string | string[] | boolean | null {
  switch (answer.type) {
    case 'text':
    case 'short_text':
    case 'long_text':
      return answer.text ?? null;
    case 'email':
      return answer.email ?? null;
    case 'phone_number':
      return answer.phone_number ?? null;
    case 'number':
      return answer.number != null ? String(answer.number) : null;
    case 'boolean':
      return answer.boolean ?? null;
    case 'date':
      return answer.date ?? null;
    case 'url':
      return answer.url ?? null;
    case 'choice':
      return answer.choice?.label ?? null;
    case 'choices':
      return answer.choices?.labels ?? null;
    default:
      return null;
  }
}

function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.TYPEFORM_WEBHOOK_SECRET;
  if (!secret) return false;
  if (!signatureHeader) return false;

  const expected =
    'sha256=' + createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64');

  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('typeform-signature');

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as TypeformPayload;
  const answers = payload.form_response.answers ?? [];

  const record: Record<string, unknown> = {
    date_registered: payload.form_response.submitted_at,
    entity: DEFAULT_ENTITY,
    status: 'Open',
    gdpr_accepted: true,
  };

  for (const answer of answers) {
    const ref = answer.field.ref;
    if (!ref) continue;

    if (ref === ENTITY_FIELD_REF) {
      const value = answerValue(answer);
      if (typeof value === 'string') record.entity = value;
      continue;
    }

    const column = FIELD_REF_MAP[ref];
    if (!column) continue;
    record[column] = answerValue(answer);
  }

  if (!record.name || !record.expa_ep_id) {
    // Without a mapped name/EXPA ID we'd rather fail loudly than create a
    // useless record — check FIELD_REF_MAP once the real form is wired up.
    return NextResponse.json(
      { error: 'Missing required fields — check FIELD_REF_MAP in route.ts' },
      { status: 422 }
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from('eps').insert(record);

  if (error) {
    console.error('Typeform webhook insert failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
