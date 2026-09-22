-- Synced from production (applied 2026-09-22, missing from this repo until now).
alter table public.landings add column mp_plan_id text unique;
