import type { Branch, Background, Citizenship, Language, Product, Referral, Region } from '@/lib/options';
import type { Status } from '@/lib/status';

export type Ep = {
  id: string;
  name: string;
  expa_ep_id: string;
  expa_email: string | null;
  phone_number: string | null;
  personal_emails: string[];

  entity: Branch;
  status: Status;
  desired_product: Product | null;

  background: Background | null;
  university: string[];
  university_expa: string | null;
  languages_spoken: Language[];
  languages_other: string | null;
  citizenship: Citizenship | null;
  referral: Referral | null;

  sdgs: string[];
  industries: string[];
  desired_region: Region | null;
  countries_desired: string[];
  earliest_start_date: string | null;

  next_followup_date: string | null;
  next_touchpoint_description: string | null;

  gdpr_accepted: boolean;

  date_registered: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type EpProcessTimes = {
  ep_id: string;
  open_at: string | null;
  applied_at: string | null;
  accepted_at: string | null;
  approved_at: string | null;
};

export type Profile = {
  id: string;
  email: string;
  branch: Branch;
  created_at: string;
};

export type Comment = {
  id: string;
  ep_id: string;
  author_id: string;
  body: string;
  mentioned_user_ids: string[];
  created_at: string;
};

export type Notification = {
  id: string;
  recipient_id: string;
  comment_id: string;
  ep_id: string;
  read: boolean;
  created_at: string;
};

export type EpDocument = {
  id: string;
  ep_id: string;
  file_name: string;
  storage_path: string;
  uploaded_by: string | null;
  created_at: string;
};
