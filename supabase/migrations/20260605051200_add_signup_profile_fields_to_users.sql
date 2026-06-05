alter table public.users
  add column if not exists birth_time text null,
  add column if not exists birth_time_unknown boolean null,
  add column if not exists mbti text null,
  add column if not exists marketing_consent boolean null,
  add column if not exists referred_by text null,
  add column if not exists terms_agreed boolean null,
  add column if not exists privacy_agreed boolean null;

comment on column public.users.birth_time is 'Optional signup birth time in HH:mm format.';
comment on column public.users.birth_time_unknown is 'Whether the user selected unknown birth time during signup.';
comment on column public.users.mbti is 'Optional MBTI selected during signup.';
comment on column public.users.marketing_consent is 'Optional marketing information consent selected during signup.';
comment on column public.users.referred_by is 'Optional normalized referral code entered during signup.';
comment on column public.users.terms_agreed is 'Required terms agreement captured during signup.';
comment on column public.users.privacy_agreed is 'Required privacy policy agreement captured during signup.';
