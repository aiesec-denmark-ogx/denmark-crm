import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Background, Branch, Citizenship, Product, Region } from '@/lib/options';

/**
 * ───────────────────────────────────────────────────────────────────────
 * Wired up for the "oGX Sign Up form" (form.typeform.com/to/WIhSktMp).
 * Matches questions by their TITLE (Typeform always sends the form's
 * `definition.fields` in the webhook payload, so this needs no API token
 * and no manually-copied field refs) rather than by `ref`.
 *
 * If the form's questions are reworded, update FIELD_TITLE_MAP below to
 * match the new title text exactly.
 * ───────────────────────────────────────────────────────────────────────
 */

const DEFAULT_ENTITY: Branch = 'MC Denmark';

const FIELD_OF_STUDY_MAP: Record<string, Background> = {
  'Business & Economics': 'Finance',
  'Social Sciences': 'Political Sciences',
  'Humanities & Languages': 'Languages',
  'Psychology & Education': 'Education Sciences',
  Law: 'Law',
  'Engineering & Technology': 'Engineering',
  'Computer Science & IT': 'IT',
  'Natural Sciences': 'Natural Sciences',
  'Health & Medicine': 'Other',
  'Arts, Design & Creative Studies': 'Other',
  'Environment & Sustainability': 'Other',
  Other: 'Other',
};

const REGION_MAP: Record<string, Region> = {
  Europe: 'Europe',
  'Middle East': 'MEA',
  Asia: 'AP',
  'South America': 'Americas',
};

const EXCHANGE_TYPE_MAP: Record<string, Product> = {
  'Internship program': 'Global Talent',
  'Volunteering program': 'Global Volunteer',
  // 'Both' is intentionally left unmapped — a branch member decides manually.
};

const EU_COUNTRIES = new Set([
  'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 'Czechia',
  'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Ireland',
  'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands', 'Poland',
  'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden',
]);

const EUROPE_NON_EU_COUNTRIES = new Set([
  'United Kingdom', 'Norway', 'Switzerland', 'Iceland', 'Ukraine', 'Serbia',
  'Bosnia and Herzegovina', 'Albania', 'North Macedonia', 'Montenegro', 'Moldova',
  'Belarus', 'Kosovo', 'Liechtenstein', 'Monaco', 'San Marino', 'Andorra',
  'Vatican City', 'Turkey',
]);

// Typeform's country dropdown answers come back as "🇩🇰 Denmark" — the flag
// is part of the choice label, not just UI decoration.
function stripFlag(label: string | null): string | null {
  if (!label) return label;
  return label.replace(/^\p{Regional_Indicator}{2}\s*/u, '').trim();
}

function mapCitizenship(country: string | null): Citizenship | null {
  if (!country) return null;
  if (country === 'Denmark') return 'Danish';
  if (EU_COUNTRIES.has(country)) return 'Europe - EU';
  if (EUROPE_NON_EU_COUNTRIES.has(country)) return 'Europe - non-EU';
  return 'Others';
}

// Typeform includes "(optional)" as literal title text for optional
// questions, not just a UI badge — strip it so title matching is reliable.
function normalizeTitle(title: string): string {
  return title.replace(/\s*\(optional\)\s*$/i, '').trim();
}

// Typeform fires a webhook for the Go zero-date sentinel ("0001-01-01...")
// on incomplete/partial submissions. Treat those as not-a-real-submission.
function isCompleteSubmission(submittedAt: string | undefined): boolean {
  if (!submittedAt) return false;
  const year = new Date(submittedAt).getUTCFullYear();
  return !Number.isNaN(year) && year > 1970;
}

function detectEntity(cityAnswer: string | null): Branch {
  if (!cityAnswer) return DEFAULT_ENTITY;
  const c = cityAnswer.toLowerCase();
  if (c.includes('odense')) return 'Odense';
  if (c.includes('københavn') || c.includes('kobenhavn') || c.includes('copenhagen') || c.includes('kbh')) {
    return 'Copenhagen';
  }
  if (c.includes('aarhus') || c.includes('århus') || c.includes('arhus')) return 'Aarhus';
  return DEFAULT_ENTITY;
}

type TypeformField = { id: string; title: string; type: string };

type TypeformAnswer = {
  field: { id: string; type: string };
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
  file_url?: string;
};

type TypeformPayload = {
  event_type: string;
  form_response: {
    form_id: string;
    submitted_at: string;
    definition: { fields: TypeformField[] };
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
    case 'website':
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

  if (!isCompleteSubmission(payload.form_response.submitted_at)) {
    return NextResponse.json({ ok: true, skipped: 'incomplete submission' });
  }

  const answers = payload.form_response.answers ?? [];
  const fieldTitleById = new Map(
    (payload.form_response.definition?.fields ?? []).map((f) => [f.id, f.title])
  );

  let firstName = '';
  let lastName = '';
  const personalEmails: string[] = [];
  let cvAnswer: TypeformAnswer | null = null;

  const record: Record<string, unknown> = {
    expa_ep_id: `PENDING-${randomUUID().slice(0, 8)}`,
    entity: DEFAULT_ENTITY,
    status: 'Open',
    gdpr_accepted: false,
  };

  for (const answer of answers) {
    const rawTitle = fieldTitleById.get(answer.field.id);
    if (!rawTitle) continue;
    const title = normalizeTitle(rawTitle);
    const value = answer.type === 'file_url' ? null : answerValue(answer);

    switch (title) {
      case 'First name':
        if (typeof value === 'string') firstName = value;
        break;
      case 'Last name':
        if (typeof value === 'string') lastName = value;
        break;
      case 'Phone number':
        record.phone_number = value;
        break;
      case 'Email':
        if (typeof value === 'string') personalEmails.push(value);
        break;
      case 'What is country you currently reside in?':
        record.country_of_residence = typeof value === 'string' ? stripFlag(value) : value;
        break;
      case 'What is your nationality?':
        record.citizenship = mapCitizenship(
          typeof value === 'string' ? stripFlag(value) : null
        );
        break;
      case 'What is your date of birth?':
        record.date_of_birth = value;
        break;
      case 'Which city are you currently living in?':
        record.entity = detectEntity(typeof value === 'string' ? value : null);
        break;
      case 'Which university or educational institution are you enrolled in?':
        record.university = typeof value === 'string' ? [value] : [];
        break;
      case 'What is your field of study?':
        record.background =
          typeof value === 'string' ? (FIELD_OF_STUDY_MAP[value] ?? 'Other') : null;
        break;
      case 'What semester are you currently in?':
        record.semester = value;
        break;
      case 'Which exchange type are you most interested in?':
        record.desired_product =
          typeof value === 'string' ? (EXCHANGE_TYPE_MAP[value] ?? null) : null;
        break;
      case 'Which region would you prefer to go to for your exchange?':
        record.desired_region = typeof value === 'string' ? (REGION_MAP[value] ?? null) : null;
        break;
      case 'When would you be available to start your exchange?':
        record.earliest_start_date = value;
        break;
      case 'Please upload your CV (PDF or Word).':
        if (answer.type === 'file_url') cvAnswer = answer;
        break;
      case 'Share your LinkedIn profile or portfolio':
        record.linkedin_url = value;
        break;
      case 'Data Processing Consent':
        record.gdpr_accepted = value === true;
        break;
      default:
        break;
    }
  }

  record.name = `${firstName} ${lastName}`.trim();
  record.personal_emails = personalEmails;
  record.date_registered = payload.form_response.submitted_at;

  if (!record.name) {
    return NextResponse.json(
      { error: 'Missing required fields — check FIELD_TITLE_MAP in route.ts' },
      { status: 422 }
    );
  }

  const supabase = createAdminClient();
  const { data: inserted, error } = await supabase
    .from('eps')
    .insert(record)
    .select('id')
    .single();

  if (error) {
    console.error('Typeform webhook insert failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (cvAnswer?.file_url) {
    try {
      const fileRes = await fetch(cvAnswer.file_url);
      if (fileRes.ok) {
        const blob = await fileRes.blob();
        const urlParts = cvAnswer.file_url.split('/');
        const fileName = decodeURIComponent(urlParts[urlParts.length - 1] || 'cv');
        const storagePath = `${inserted.id}/${Date.now()}-${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('ep-documents')
          .upload(storagePath, blob, { contentType: blob.type || 'application/octet-stream' });

        if (!uploadError) {
          await supabase.from('ep_documents').insert({
            ep_id: inserted.id,
            file_name: fileName,
            storage_path: storagePath,
            size_bytes: blob.size,
          });
        } else {
          console.error('Typeform CV upload failed:', uploadError);
        }
      }
    } catch (err) {
      console.error('Typeform CV fetch/upload failed:', err);
    }
  }

  return NextResponse.json({ ok: true, id: inserted.id });
}
