-- Development-only data correction after changing referral reward from 3,900 to 1,950 points.
-- Do not run this against production unless you intentionally want to rewrite historical rewards.

begin;

update public.referral_rewards
set reward_points = 1950
where reward_points = 3900;

update public.users u
set referral_reward_balance = coalesce(rr.total_reward_points, 0)
from (
  select
    lower(referrer_email) as referrer_email,
    sum(reward_points)::integer as total_reward_points
  from public.referral_rewards
  group by lower(referrer_email)
) rr
where lower(u.email) = rr.referrer_email;

update public.users u
set referral_reward_balance = 0
where not exists (
  select 1
  from public.referral_rewards rr
  where lower(rr.referrer_email) = lower(u.email)
);

commit;
