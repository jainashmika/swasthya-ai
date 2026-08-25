-- SwasthyaAI (Simple) — database schema
-- Run once against your Neon/Postgres database:
--   psql "$DATABASE_URL" -f schema.sql
-- or paste into the Neon SQL editor.

create table if not exists alerts (
  id         serial primary key,
  severity   text        not null default 'medium',  -- critical | high | medium | low
  title      text        not null,
  message    text        not null,
  region     text        not null default 'All India',
  is_active  boolean     not null default true,
  created_at timestamptz not null default now()
);

create table if not exists queries (
  id         serial primary key,
  kind       text        not null,                   -- chat | symptom | image
  text       text,
  language   text        not null default 'en',
  flags      text[]      not null default '{}',      -- e.g. {emergency}
  created_at timestamptz not null default now()
);

create index if not exists alerts_active_idx  on alerts (is_active, region);
create index if not exists queries_created_idx on queries (created_at desc);

-- A few alerts to start with. Safe to delete.
insert into alerts (severity, title, message, region) values
  ('high',   'Dengue cases rising',
   'Dengue cases are increasing with the monsoon. Remove standing water around your home, use mosquito nets, and see a doctor if fever lasts more than two days.',
   'Karnataka'),
  ('medium', 'Seasonal influenza advisory',
   'Flu cases are up this season. Wash hands often, cover your mouth when coughing, and stay home if you have a fever.',
   'All India'),
  ('low',    'Free vaccination camps this month',
   'Government health centres are running free routine immunisation camps. Contact your nearest PHC for dates.',
   'All India')
on conflict do nothing;
