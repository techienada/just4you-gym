create table if not exists renewal_reminders (
  id uuid default gen_random_uuid() primary key,
  member_id uuid not null references members(id) on delete cascade,
  reminder_type text not null,
  reminder_date date not null default current_date,
  status text not null default 'queued',
  provider_message text,
  response_payload jsonb,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  unique (member_id, reminder_type, reminder_date)
);

alter table if exists renewal_reminders disable row level security;

create index if not exists renewal_reminders_member_idx
on renewal_reminders(member_id);

create index if not exists renewal_reminders_date_idx
on renewal_reminders(reminder_date desc);
