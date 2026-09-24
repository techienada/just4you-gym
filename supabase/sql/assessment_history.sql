create table if not exists assessment_history (
  id uuid primary key,
  member_id uuid not null references members(id) on delete cascade,
  assessment_date date not null default current_date,
  height numeric,
  weight numeric,
  body_fat numeric,
  visceral_fat numeric,
  bmr numeric,
  body_age integer,
  trunk_fat numeric,
  skeletal_muscle numeric,
  profile_note text,
  remarks text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table if exists assessment_history disable row level security;

create index if not exists assessment_history_member_date_idx
on assessment_history (member_id, assessment_date desc, updated_at desc);
