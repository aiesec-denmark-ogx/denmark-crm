// Mirrors the Postgres enums in supabase/migrations/0001_init.sql.
// Keep these in sync if the schema changes.

export const BRANCHES = ['Odense', 'Kopenhag', 'Aarhus', 'MC Denmark'] as const;
export type Branch = (typeof BRANCHES)[number];

/** Branches a user can pick as "their" branch at onboarding (MC Denmark sees everything). */
export const SELECTABLE_BRANCHES = BRANCHES;

export const PRODUCTS = ['Global Volunteer', 'Global Talent'] as const;
export type Product = (typeof PRODUCTS)[number];

export const BACKGROUNDS = [
  'BA', 'BD', 'IT', 'Finance', 'Engineering', 'Marketing',
  'Education Sciences', 'Humanities/Social Studies', 'Languages',
  'Political Sciences', 'Law', 'Natural Sciences', 'Other',
] as const;
export type Background = (typeof BACKGROUNDS)[number];

export const LANGUAGES = ['English', 'Spanish', 'Portuguese', 'Danish', 'Arabic', 'Other'] as const;
export type Language = (typeof LANGUAGES)[number];

export const CITIZENSHIPS = ['Danish', 'Europe - EU', 'Europe - non-EU', 'Others'] as const;
export type Citizenship = (typeof CITIZENSHIPS)[number];

export const REFERRALS = ['Social Media', 'Friend Referral', 'Stand/Event'] as const;
export type Referral = (typeof REFERRALS)[number];

export const REGIONS = ['Americas', 'Europe', 'MEA', 'AP', "Don't know yet", 'Open to anything'] as const;
export type Region = (typeof REGIONS)[number];

export const SDGS = [
  '1 Zero Poverty', '2 Zero Hunger', '3 Health & Well-Being', '4 Quality Education',
  '5 Gender Equality', '6 Clean Water and Sanitation', '7 Affordable and Clean Energy',
  '8 Decent Work and Economic Growth', '9 Industry, Innovation and Infrastructure',
  '10 Reduced Inequalities', '11 Sustainable Cities and Communities',
  '12 Responsible Consumption and Production', '13 Climate Action', '14 Life Below Water',
  '15 Life on Land', '16 Peace, Justice and Strong Institutions', '17 Partnership for the Goals',
] as const;

export const INDUSTRIES = [
  'Information Technology (IT)', 'Healthcare and Pharmaceuticals', 'Finance and Banking',
  'Marketing and Advertising', 'Media and Communications', 'Engineering',
  'Creative Arts and Design', 'Hospitality and Tourism', 'Law and Legal Services',
  'Environmental and Sustainability', 'Human Resources', 'Retail and E-commerce',
  'Entrepreneurship and Startups', 'Supply Chain and Logistics',
  'Automotive and Transportation', 'Agriculture and Food',
] as const;
