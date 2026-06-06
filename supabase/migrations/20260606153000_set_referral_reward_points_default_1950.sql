alter table public.referral_rewards
  alter column reward_points set default 1950;

comment on column public.referral_rewards.reward_points is 'Referral reward points granted for this purchase. Current referral reward is 1950 points.';
