alter table public.users
  add column if not exists referral_code text null,
  add column if not exists referral_reward_balance integer not null default 0,
  add column if not exists referral_success_count integer not null default 0;

comment on column public.users.referral_code is 'Uppercase referral code owned by this user.';
comment on column public.users.referral_reward_balance is 'Accumulated referral reward points for future report purchase benefits.';
comment on column public.users.referral_success_count is 'Count of referred users who completed first paid purchase.';

create table if not exists public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  purchase_id text not null,
  buyer_email text not null,
  referrer_email text not null,
  referral_code text not null,
  reward_points integer not null default 1950,
  created_at timestamptz not null default now()
);

alter table public.referral_rewards
  add column if not exists referral_code text;

update public.referral_rewards rr
set referral_code = u.referral_code
from public.users u
where rr.referral_code is null
  and lower(rr.referrer_email) = lower(u.email)
  and u.referral_code is not null;

alter table public.referral_rewards
  alter column referral_code set not null;

comment on column public.referral_rewards.referral_code is 'Referrer referral code used for this reward grant.';

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'referral_rewards'
      and column_name = 'reward_amount_won'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'referral_rewards'
      and column_name = 'reward_points'
  ) then
    alter table public.referral_rewards
      rename column reward_amount_won to reward_points;
  end if;
end $$;

alter table public.referral_rewards
  add column if not exists reward_points integer default 1950;

update public.referral_rewards
set reward_points = 1950
where reward_points is null;

alter table public.referral_rewards
  alter column reward_points set not null;

comment on column public.referral_rewards.reward_points is 'Referral reward points granted for this purchase.';

create unique index if not exists referral_rewards_purchase_id_key
  on public.referral_rewards (purchase_id);

create unique index if not exists referral_rewards_buyer_email_key
  on public.referral_rewards (buyer_email);

comment on table public.referral_rewards is 'Referral point grants keyed by purchase_id with one reward per referee buyer_email.';

-- Server routes use SUPABASE_SERVICE_ROLE_KEY when set (lib/server/supabaseAdmin.ts).
-- Service role bypasses RLS. If only anon key is configured, ensure policies allow:
--   - SELECT/INSERT on referral_rewards
--   - SELECT/UPDATE on users (referral_reward_balance, referral_success_count, referral_code)
